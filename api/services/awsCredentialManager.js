import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { SSOClient, GetRoleCredentialsCommand } from '@aws-sdk/client-sso';
import { SSOOIDCClient, CreateTokenCommand, StartDeviceAuthorizationCommand } from '@aws-sdk/client-sso-oidc';
import { S3Client } from '@aws-sdk/client-s3';
import { fromSSO, fromWebToken, fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import { getDbPool } from '../db.js';
import crypto from 'crypto';

class AWSCredentialManager {
  constructor() {
    this.s3Client = null;
    this.credentialProvider = null;
    this.isInitialized = false;
    this.refreshTimer = null;
  }

  /**
   * Initialize automatic credential provider using AWS SDK's built-in refresh
   */
  async initializeCredentialProvider() {
    try {
      console.log('🔄 Initializing AWS SDK automatic credential provider...');
      
      const config = await this.getStoredAWSConfig();
      if (!config) {
        throw new Error('No AWS configuration found in database');
      }

      let credentialProvider;

      // Method 1: Use SSO if configured
      if (config.ssoStartUrl && config.ssoRegion && config.ssoAccountId && config.ssoRoleName) {
        console.log('🔑 Using AWS SSO credential provider (auto-refresh enabled)');
        credentialProvider = fromSSO({
          ssoStartUrl: config.ssoStartUrl,
          ssoRegion: config.ssoRegion,
          ssoAccountId: config.ssoAccountId,
          ssoRoleName: config.ssoRoleName,
          clientName: 'BedtimeBlog-MediaManager'
        });
      }
      // Method 2: Use role assumption with auto-refresh
      else if (config.roleArn && config.accessKey && config.secretKey) {
        console.log('🔑 Using role assumption with auto-refresh');
        credentialProvider = fromTemporaryCredentials({
          masterCredentials: {
            accessKeyId: config.accessKey,
            secretAccessKey: config.secretKey,
            ...(config.sessionToken && { sessionToken: config.sessionToken })
          },
          params: {
            RoleArn: config.roleArn,
            RoleSessionName: 'BedtimeBlog-MediaManager',
            DurationSeconds: 3600, // 1 hour
            ...(config.externalId && { ExternalId: config.externalId })
          },
          // The SDK will automatically refresh 5 minutes before expiration
        });
      }
      // Method 3: Use direct credentials with custom refresh logic
      else if (config.accessKey && config.secretKey) {
        console.log('🔑 Using direct credentials with custom refresh wrapper');
        credentialProvider = this.createRefreshableCredentialProvider(config);
      }
      else {
        throw new Error('Insufficient AWS configuration for automatic credential provider');
      }

      // Create S3 client with the credential provider
      this.s3Client = new S3Client({
        region: config.region || 'eu-west-2',
        credentials: credentialProvider
      });

      this.credentialProvider = credentialProvider;
      this.isInitialized = true;

      console.log('✅ AWS SDK automatic credential provider initialized successfully');
      console.log('📋 Credentials will be automatically refreshed by AWS SDK');

      return {
        success: true,
        message: 'AWS SDK automatic credential provider initialized',
        autoRefresh: true
      };

    } catch (error) {
      console.error('❌ Failed to initialize credential provider:', error.message);
      throw error;
    }
  }

  /**
   * Create a refreshable credential provider for Identity Center credentials
   */
  createRefreshableCredentialProvider(config) {
    // Set up proactive refresh timer
    this.setupProactiveRefresh(config);
    
    const refreshFunction = async () => {
      try {
        console.log('🔄 AWS SDK triggered credential refresh...');
        
        // Get latest config from database (in case it was updated)
        const latestConfig = await this.getStoredAWSConfig();
        if (!latestConfig || !latestConfig.accessKey || !latestConfig.secretKey) {
          throw new Error('No valid credentials in database. Please update in Operations Panel.');
        }
        
        // Check if Identity Center credentials are about to expire
        if (latestConfig.expiresAt) {
          const expirationTime = new Date(latestConfig.expiresAt);
          const timeUntilExpiry = expirationTime.getTime() - Date.now();
          const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
          
          if (hoursUntilExpiry < 0.5) { // Less than 30 minutes
            console.warn('⚠️ Identity Center credentials expire in less than 30 minutes!');
            console.warn('🔔 ACTION REQUIRED: Please refresh credentials in Operations Panel soon');
          }
        }

        // If we have role assumption configured, use STS to get new credentials
        if (latestConfig.roleArn && latestConfig.externalId) {
          console.log('🎭 Refreshing credentials via role assumption...');
          
          const { STSClient, AssumeRoleCommand } = await import('@aws-sdk/client-sts');
          
          const stsClient = new STSClient({
            region: latestConfig.region || 'eu-west-2',
            credentials: {
              accessKeyId: latestConfig.accessKey,
              secretAccessKey: latestConfig.secretKey,
              ...(latestConfig.sessionToken && { sessionToken: latestConfig.sessionToken })
            }
          });
          
          const assumeRoleCommand = new AssumeRoleCommand({
            RoleArn: latestConfig.roleArn,
            RoleSessionName: 'BedtimeBlog-AutoRefresh',
            DurationSeconds: 3600, // 1 hour
            ExternalId: latestConfig.externalId
          });
          
          const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
          
          const newCredentials = {
            accessKeyId: assumeRoleResponse.Credentials.AccessKeyId,
            secretAccessKey: assumeRoleResponse.Credentials.SecretAccessKey,
            sessionToken: assumeRoleResponse.Credentials.SessionToken,
            expiration: assumeRoleResponse.Credentials.Expiration
          };
          
          // Update database with new credentials
          await this.updateCredentialsInDatabase({
            ...latestConfig,
            accessKey: newCredentials.accessKeyId,
            secretKey: newCredentials.secretAccessKey,
            sessionToken: newCredentials.sessionToken,
            lastRefresh: new Date().toISOString(),
            expiresAt: newCredentials.expiration.toISOString()
          });
          
          console.log('✅ AWS SDK credential refresh completed and database updated');
          return newCredentials;
          
        } else {
          // For direct credentials, return as-is but update last refresh time
          const credentials = {
            accessKeyId: latestConfig.accessKey,
            secretAccessKey: latestConfig.secretKey,
            ...(latestConfig.sessionToken && { sessionToken: latestConfig.sessionToken }),
            // Set expiration to 30 minutes from now to trigger frequent refreshes
            expiration: new Date(Date.now() + (30 * 60 * 1000)) // 30 minutes from now
          };
          
          // Update last refresh time in database
          await this.updateCredentialsInDatabase({
            ...latestConfig,
            lastRefresh: new Date().toISOString()
          });
          
          console.log('✅ AWS SDK credential refresh completed (30-minute cycle)');
          return credentials;
        }

      } catch (error) {
        console.error('❌ AWS SDK credential refresh failed:', error.message);
        
        // If it's an Identity Center expiration, provide helpful message
        if (error.message.includes('No valid credentials')) {
          console.error('🔔 ACTION REQUIRED: Please update Identity Center credentials in Operations Panel');
          throw new Error('Identity Center credentials expired. Please refresh in Operations Panel.');
        }
        
        throw error;
      }
    };

    // Return a credential provider function that AWS SDK can use
    return async () => {
      return await refreshFunction();
    };
  }

  /**
   * Get S3 client with automatic credential refresh
   */
  async getS3Client() {
    if (!this.isInitialized) {
      await this.initializeCredentialProvider();
    }
    return this.s3Client;
  }

  /**
   * Get credentials (SDK handles refresh automatically)
   */
  async getCredentials() {
    if (!this.isInitialized) {
      await this.initializeCredentialProvider();
    }

    try {
      // AWS SDK automatically refreshes credentials when needed
      const credentials = await this.credentialProvider();
      console.log('✅ Credentials obtained (AWS SDK auto-refresh active)');
      return credentials;
    } catch (error) {
      console.error('❌ Failed to get credentials:', error.message);
      
      // Try to reinitialize if credentials failed
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        console.log('🔄 Attempting to reinitialize credential provider...');
        this.isInitialized = false;
        await this.initializeCredentialProvider();
        return await this.credentialProvider();
      }
      
      throw error;
    }
  }

  /**
   * Force reinitialize credential provider (for configuration changes)
   */
  async reinitialize() {
    console.log('🔄 Force reinitializing credential provider...');
    this.isInitialized = false;
    this.s3Client = null;
    this.credentialProvider = null;
    return await this.initializeCredentialProvider();
  }

  /**
   * Get credential status with AWS SDK integration
   */
  async getStatus() {
    try {
      const config = await this.getStoredAWSConfig();
      let status = {
        configured: !!config,
        initialized: this.isInitialized,
        autoRefresh: true, // AWS SDK handles this
        sdkManaged: true,
        lastCheck: new Date().toISOString()
      };

      if (this.isInitialized && this.credentialProvider) {
        try {
          // Test credentials by calling the provider
          const credentials = await this.credentialProvider();
          status.credentialsValid = true;
          status.hasExpiration = !!credentials.expiration;
          
          if (credentials.expiration) {
            const timeUntilExpiry = new Date(credentials.expiration).getTime() - Date.now();
            status.timeUntilExpiry = timeUntilExpiry;
            status.timeUntilExpiryMinutes = Math.floor(timeUntilExpiry / 60000);
            status.isNearExpiry = timeUntilExpiry <= 300000; // Within 5 minutes
          }
          
        } catch (credError) {
          status.credentialsValid = false;
          status.error = credError.message;
        }
      }

      // Determine authentication method
      if (config) {
        if (config.ssoStartUrl) {
          status.authMethod = 'AWS SSO (Identity Center)';
        } else if (config.roleArn) {
          status.authMethod = 'IAM Role Assumption';
        } else {
          status.authMethod = 'Direct IAM Credentials';
        }
      }

      return status;

    } catch (error) {
      return {
        configured: false,
        initialized: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Test credentials by making an actual AWS call
   */
  async testCredentials() {
    try {
      const s3Client = await this.getS3Client();
      
      // Make a simple call to test credentials
      const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
      const stsClient = new STSClient({
        region: 'eu-west-2',
        credentials: this.credentialProvider
      });
      
      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);
      
      return {
        success: true,
        message: 'Credentials are valid and working',
        identity: {
          arn: response.Arn,
          userId: response.UserId,
          account: response.Account
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Credential test failed',
        error: error.message
      };
    }
  }

  /**
   * Get AWS configuration from database
   */
  async getStoredAWSConfig() {
    try {
      const pool = getDbPool();
      const result = await pool.query("SELECT value FROM settings WHERE key = 'aws_config'");
      
      if (result.rows.length === 0) {
        return null;
      }

      return JSON.parse(result.rows[0].value);
    } catch (error) {
      console.error('Error fetching AWS config from database:', error);
      return null;
    }
  }

  /**
   * Update AWS configuration and reinitialize
   */
  async updateConfiguration(newConfig) {
    try {
      const pool = getDbPool();
      
      // Store new configuration
      await pool.query(
        "INSERT INTO settings (key, value, type) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        ['aws_config', JSON.stringify(newConfig), 'json']
      );
      
      // Reinitialize with new configuration
      await this.reinitialize();
      
      console.log('✅ AWS configuration updated and credential provider reinitialized');
      
      return {
        success: true,
        message: 'Configuration updated and automatic refresh reinitialized'
      };
      
    } catch (error) {
      console.error('❌ Failed to update configuration:', error.message);
      throw error;
    }
  }

  /**
   * Update credentials in database (for automatic refresh)
   */
  async updateCredentialsInDatabase(updatedConfig) {
    try {
      const pool = getDbPool();
      
      // Store updated configuration with new credentials
      await pool.query(
        "INSERT INTO settings (key, value, type) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        ['aws_config', JSON.stringify(updatedConfig), 'json']
      );
      
      console.log('✅ AWS credentials updated in database');
      
    } catch (error) {
      console.error('❌ Failed to update credentials in database:', error.message);
      throw error;
    }
  }

  /**
   * Setup proactive refresh timer to avoid expiration
   */
  setupProactiveRefresh(config) {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Set up a timer to check credentials every 15 minutes
    this.refreshTimer = setInterval(async () => {
      try {
        const latestConfig = await this.getStoredAWSConfig();
        if (!latestConfig || !latestConfig.expiresAt) return;
        
        const expirationTime = new Date(latestConfig.expiresAt);
        const timeUntilExpiry = expirationTime.getTime() - Date.now();
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
        
        // If less than 2 hours until expiry, log a warning
        if (hoursUntilExpiry < 2 && hoursUntilExpiry > 0) {
          console.warn(`⚠️ Identity Center credentials expire in ${Math.round(hoursUntilExpiry * 60)} minutes`);
          console.warn('🔔 Consider refreshing credentials in Operations Panel soon');
        }
        
        // If less than 30 minutes until expiry, force reinitialize
        if (hoursUntilExpiry < 0.5 && hoursUntilExpiry > 0) {
          console.warn('🚨 URGENT: Credentials expire in less than 30 minutes - attempting refresh');
          try {
            await this.reinitialize();
          } catch (refreshError) {
            console.error('❌ Automatic refresh failed:', refreshError.message);
          }
        }
        
      } catch (error) {
        console.error('❌ Proactive refresh check failed:', error.message);
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
    
    console.log('⏰ Proactive credential refresh timer started (15-minute intervals)');
  }
}

// Singleton instance with automatic initialization
const credentialManager = new AWSCredentialManager();

// Initialize on startup
credentialManager.initializeCredentialProvider().catch(error => {
  console.warn('⚠️ Could not initialize credential provider on startup:', error.message);
  console.warn('🔔 Credentials will be initialized on first use');
});

export default credentialManager;
