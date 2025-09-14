import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { SSOClient, GetRoleCredentialsCommand } from '@aws-sdk/client-sso';
import { SSOOIDCClient, CreateTokenCommand, StartDeviceAuthorizationCommand } from '@aws-sdk/client-sso-oidc';
import { fromSSO } from '@aws-sdk/credential-providers';
import { getDbPool } from '../db.js';
import crypto from 'crypto';

class AWSCredentialManager {
  constructor() {
    this.cachedCredentials = null;
    this.credentialExpiry = null;
    this.refreshTimer = null;
    this.monitoringTimer = null;
    this.isRefreshing = false;
    this.ssoCredentialProvider = null;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 5;
    this.ssoConfig = {
      ssoStartUrl: 'https://ingasti.awsapps.com/start/#',
      ssoRegion: 'eu-west-2',
      // These will be set when configuration is provided
      ssoAccountId: null,
      ssoRoleName: null
    };
    
    // Start background monitoring immediately
    this.startBackgroundMonitoring();
  }

  /**
   * Initialize SSO credential provider with AWS SDK built-in refresh
   */
  async initializeSSO(accountId, roleName) {
    try {
      console.log('🔄 Initializing AWS SSO credential provider...');
      
      this.ssoConfig.ssoAccountId = accountId;
      this.ssoConfig.ssoRoleName = roleName;
      
      // Use AWS SDK's built-in SSO credential provider with automatic refresh
      this.ssoCredentialProvider = fromSSO({
        ssoStartUrl: this.ssoConfig.ssoStartUrl,
        ssoRegion: this.ssoConfig.ssoRegion,
        ssoAccountId: accountId,
        ssoRoleName: roleName,
        // Optional: clientName for better tracking
        clientName: 'BedtimeBlog-MediaManager'
      });
      
      // Store configuration
      await this.storeSSOConfig(this.ssoConfig);
      
      console.log('✅ SSO credential provider initialized successfully');
      console.log(`📋 Configuration: ${this.ssoConfig.ssoStartUrl}, Region: ${this.ssoConfig.ssoRegion}`);
      console.log(`🏢 Account: ${accountId}, Role: ${roleName}`);
      
      return {
        success: true,
        message: 'SSO credential provider initialized. Credentials will be automatically refreshed.',
        config: this.ssoConfig
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize SSO:', error.message);
      throw error;
    }
  }

  /**
   * Get credentials using SSO provider (automatically refreshes)
   */
  async getCredentialsFromSSO() {
    try {
      if (!this.ssoCredentialProvider) {
        throw new Error('SSO credential provider not initialized');
      }
      
      console.log('🔄 Getting credentials from SSO provider...');
      
      // The AWS SDK handles refresh automatically
      const credentials = await this.ssoCredentialProvider();
      
      // Cache for quick access (though SDK handles this internally)
      this.cachedCredentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken
      };
      
      // Set a reasonable expiry (SSO credentials typically last 1 hour)
      this.credentialExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes
      
      console.log('✅ Credentials obtained from SSO successfully');
      return this.cachedCredentials;
      
    } catch (error) {
      console.error('❌ Failed to get credentials from SSO:', error.message);
      
      // If SSO fails, provide helpful error message
      if (error.message.includes('SSO session')) {
        throw new Error('SSO session not found or expired. Please run: aws sso login --profile your-profile');
      }
      
      throw error;
    }
  }
  /**
   * Get valid AWS credentials, refreshing if necessary
   */
  async getCredentials() {
    // Check if SSO is configured and try that first
    if (this.ssoCredentialProvider) {
      try {
        return await this.getCredentialsFromSSO();
      } catch (ssoError) {
        console.warn('⚠️ SSO credentials failed, trying fallback:', ssoError.message);
        // Fall through to legacy method
      }
    }

    // Check for cached credentials from legacy method
    if (this.cachedCredentials && this.credentialExpiry && Date.now() < this.credentialExpiry - 300000) {
      console.log('✅ Using cached legacy AWS credentials');
      return this.cachedCredentials;
    }

    // Try to initialize SSO from stored config
    const storedConfig = await this.getStoredSSOConfig();
    if (storedConfig && storedConfig.ssoAccountId && storedConfig.ssoRoleName && !this.ssoCredentialProvider) {
      try {
        await this.initializeSSO(storedConfig.ssoAccountId, storedConfig.ssoRoleName);
        return await this.getCredentialsFromSSO();
      } catch (ssoError) {
        console.warn('⚠️ Could not initialize SSO from stored config:', ssoError.message);
      }
    }

    // Fallback to legacy refresh
    return await this.refreshCredentials();
  }

  /**
   * Refresh credentials using SSO tokens
   */
  async refreshCredentialsFromSSO() {
    try {
      console.log('🔄 Refreshing AWS credentials from SSO...');
      
      const ssoConfig = await this.getStoredSSOConfig();
      const tokenInfo = await this.getStoredSSOTokenInfo();
      
      if (!ssoConfig || !tokenInfo) {
        throw new Error('SSO configuration or token information not found');
      }
      
      // Check if SSO token needs refresh
      const tokenAge = Date.now() - tokenInfo.createdAt;
      const tokenExpiryTime = tokenInfo.expiresIn * 1000; // Convert to milliseconds
      
      if (tokenAge > tokenExpiryTime - 300000) { // Refresh 5 minutes before expiry
        console.log('🔄 SSO token expiring, refreshing...');
        await this.refreshSSOToken();
        // Get updated token info
        const updatedTokenInfo = await this.getStoredSSOTokenInfo();
        tokenInfo.accessToken = updatedTokenInfo.accessToken;
      }
      
      // Get role credentials using SSO token
      const ssoClient = new SSOClient({ region: ssoConfig.region });
      
      const getRoleCredentialsCommand = new GetRoleCredentialsCommand({
        accountId: ssoConfig.accountId,
        roleName: ssoConfig.roleName,
        accessToken: tokenInfo.accessToken
      });
      
      const credentialsResponse = await ssoClient.send(getRoleCredentialsCommand);
      
      // Cache credentials
      this.cachedCredentials = {
        accessKeyId: credentialsResponse.roleCredentials.accessKeyId,
        secretAccessKey: credentialsResponse.roleCredentials.secretAccessKey,
        sessionToken: credentialsResponse.roleCredentials.sessionToken
      };
      
      // Set expiry (SSO credentials typically last 1 hour)
      this.credentialExpiry = credentialsResponse.roleCredentials.expiration;
      
      console.log('✅ AWS credentials refreshed from SSO successfully');
      return this.cachedCredentials;
      
    } catch (error) {
      console.error('❌ Failed to refresh credentials from SSO:', error.message);
      throw error;
    }
  }

  /**
   * Refresh AWS credentials using stored Identity Center credentials
   */
  async refreshCredentials() {
    if (this.isRefreshing) {
      console.log('⏳ Credential refresh already in progress, waiting...');
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.isRefreshing) {
            clearInterval(checkInterval);
            if (this.cachedCredentials) {
              resolve(this.cachedCredentials);
            } else {
              reject(new Error('Credential refresh failed'));
            }
          }
        }, 100);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Credential refresh timeout'));
        }, 30000);
      });
    }

    this.isRefreshing = true;

    try {
      console.log('🔄 Refreshing AWS credentials...');
      
      // Get stored configuration from database
      const config = await this.getStoredAWSConfig();
      if (!config) {
        throw new Error('No AWS configuration found in database');
      }

      // Validate we have bootstrap credentials
      if (!config.accessKey || !config.secretKey) {
        throw new Error('No Identity Center bootstrap credentials configured. Please update credentials in Operations Panel.');
      }

      let credentials;

      // If we have role configuration, use role assumption
      if (config.roleArn && config.externalId) {
        try {
          credentials = await this.assumeRole(config);
          console.log('✅ Successfully assumed role for credentials');
        } catch (roleError) {
          console.error('❌ Role assumption failed:', roleError.message);
          
          // Check if it's a credential expiration issue
          if (roleError.name === 'InvalidClientTokenId' || 
              roleError.name === 'TokenRefreshRequired' ||
              roleError.name === 'ExpiredToken') {
            throw new Error('Identity Center credentials have expired (12-hour limit). Please refresh them in the Operations Panel.');
          }
          throw roleError;
        }
      } else {
        // Use direct credentials (temporary from Identity Center)
        credentials = {
          accessKeyId: config.accessKey,
          secretAccessKey: config.secretKey,
          sessionToken: config.sessionToken,
        };
        console.log('✅ Using direct Identity Center credentials');
      }

      // Cache credentials with expiry
      this.cachedCredentials = credentials;
      
      // Set expiry based on credential type
      if (config.roleArn) {
        // Role credentials expire in 1 hour
        this.credentialExpiry = Date.now() + (55 * 60 * 1000); // Expire in 55 minutes
      } else {
        // Identity Center credentials expire in 12 hours, but refresh every 11 hours
        this.credentialExpiry = Date.now() + (11 * 60 * 60 * 1000); // Expire in 11 hours
      }
      
      // Schedule next refresh
      this.scheduleCredentialRefresh();

      console.log('✅ AWS credentials refreshed successfully');
      return credentials;

    } catch (error) {
      console.error('❌ Failed to refresh AWS credentials:', error.message);
      
      // Clear cached credentials on failure
      this.cachedCredentials = null;
      this.credentialExpiry = null;
      
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Assume role using bootstrap credentials
   */
  async assumeRole(config) {
    const stsClient = new STSClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
        ...(config.sessionToken && { sessionToken: config.sessionToken })
      }
    });

    const command = new AssumeRoleCommand({
      RoleArn: config.roleArn,
      RoleSessionName: 'MediaLibraryAutoRefresh',
      DurationSeconds: 3600, // 1 hour
      ...(config.externalId && { ExternalId: config.externalId })
    });

    const response = await stsClient.send(command);
    
    return {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
    };
  }

  /**
   * Initiate device authorization flow for SSO
   */
  async initiateDeviceAuthorization(startUrl, region) {
    try {
      const ssoOIDCClient = new SSOOIDCClient({ region });
      
      // Register client
      const clientName = 'BedtimeBlog-MediaManager';
      const clientType = 'public';
      const scopes = ['sso:account:access'];
      
      // For device flow, we need to create a device authorization request
      // This is a simplified version - in production you'd want to store client registration
      const deviceAuthRequest = {
        clientId: `bedtime-blog-${crypto.randomBytes(8).toString('hex')}`,
        clientSecret: crypto.randomBytes(32).toString('hex'),
        startUrl: startUrl,
        verificationUri: `https://device.sso.${region}.amazonaws.com/`,
        verificationUriComplete: `https://device.sso.${region}.amazonaws.com/`,
        userCode: this.generateUserCode(),
        deviceCode: crypto.randomBytes(32).toString('hex'),
        expiresIn: 900, // 15 minutes
        interval: 5
      };
      
      return deviceAuthRequest;
      
    } catch (error) {
      console.error('Error initiating device authorization:', error);
      throw error;
    }
  }

  /**
   * Generate a user-friendly code for device authorization
   */
  generateUserCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result.match(/.{1,4}/g).join('-'); // Format as XXXX-XXXX
  }

  /**
   * Refresh SSO token using refresh token
   */
  async refreshSSOToken() {
    try {
      const ssoConfig = await this.getStoredSSOConfig();
      const tokenInfo = await this.getStoredSSOTokenInfo();
      
      if (!tokenInfo.refreshToken) {
        throw new Error('No refresh token available, re-authorization required');
      }
      
      const ssoOIDCClient = new SSOOIDCClient({ region: ssoConfig.region });
      
      const refreshCommand = new CreateTokenCommand({
        clientId: this.deviceAuthInfo.clientId,
        clientSecret: this.deviceAuthInfo.clientSecret,
        grantType: 'refresh_token',
        refreshToken: tokenInfo.refreshToken
      });
      
      const response = await ssoOIDCClient.send(refreshCommand);
      
      // Update stored token info
      const updatedTokenInfo = {
        ...tokenInfo,
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        refreshToken: response.refreshToken || tokenInfo.refreshToken,
        createdAt: Date.now()
      };
      
      await this.storeSSOTokenInfo(updatedTokenInfo);
      this.ssoTokenInfo = updatedTokenInfo;
      
      console.log('✅ SSO token refreshed successfully');
      
    } catch (error) {
      console.error('❌ Failed to refresh SSO token:', error.message);
      throw error;
    }
  }

  /**
   * Schedule SSO token renewal
   */
  scheduleSSORenewal() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule renewal for 8 hours (SSO tokens typically last 12 hours)
    const renewalInterval = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    
    this.refreshTimer = setTimeout(async () => {
      try {
        console.log('⏰ Scheduled SSO token renewal triggered');
        await this.refreshSSOToken();
        await this.refreshCredentialsFromSSO();
        this.scheduleSSORenewal(); // Schedule next renewal
      } catch (error) {
        console.error('❌ Scheduled SSO renewal failed:', error.message);
        // Retry in 30 minutes
        setTimeout(() => this.scheduleSSORenewal(), 30 * 60 * 1000);
      }
    }, renewalInterval);

    console.log(`⏰ Next SSO token renewal scheduled in 8 hours`);
  }

  /**
   * Store SSO configuration in database
   */
  async storeSSOConfig(ssoConfig) {
    try {
      const pool = getDbPool();
      await pool.query(
        "INSERT INTO settings (key, value, type) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        ['aws_sso_config', JSON.stringify(ssoConfig), 'json']
      );
    } catch (error) {
      console.error('Error storing SSO config:', error);
      throw error;
    }
  }

  /**
   * Get SSO configuration from database
   */
  async getStoredSSOConfig() {
    try {
      const pool = getDbPool();
      const result = await pool.query("SELECT value FROM settings WHERE key = 'aws_sso_config'");
      
      if (result.rows.length === 0) {
        return null;
      }

      return JSON.parse(result.rows[0].value);
    } catch (error) {
      console.error('Error fetching SSO config from database:', error);
      return null;
    }
  }

  /**
   * Store SSO token information in database
   */
  async storeSSOTokenInfo(tokenInfo) {
    try {
      const pool = getDbPool();
      await pool.query(
        "INSERT INTO settings (key, value, type) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        ['aws_sso_tokens', JSON.stringify(tokenInfo), 'json']
      );
    } catch (error) {
      console.error('Error storing SSO token info:', error);
      throw error;
    }
  }

  /**
   * Get SSO token information from database
   */
  async getStoredSSOTokenInfo() {
    try {
      const pool = getDbPool();
      const result = await pool.query("SELECT value FROM settings WHERE key = 'aws_sso_tokens'");
      
      if (result.rows.length === 0) {
        return null;
      }

      return JSON.parse(result.rows[0].value);
    } catch (error) {
      console.error('Error fetching SSO token info from database:', error);
      return null;
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
   * Schedule automatic credential refresh with enhanced monitoring
   */
  scheduleCredentialRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // For Identity Center credentials (12-hour expiry), refresh every 10 hours
    // For role credentials (1-hour expiry), refresh every 55 minutes
    let refreshInterval;
    let refreshBuffer;
    
    if (this.credentialExpiry) {
      const timeUntilExpiry = this.credentialExpiry - Date.now();
      refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry
      refreshInterval = Math.max(timeUntilExpiry - refreshBuffer, 60000); // At least 1 minute
    } else {
      // Default to Identity Center refresh cycle (10 hours for 12-hour tokens)
      refreshInterval = 10 * 60 * 60 * 1000; // 10 hours
      refreshBuffer = 2 * 60 * 60 * 1000; // 2 hour buffer
    }
    
    this.refreshTimer = setTimeout(async () => {
      try {
        console.log('⏰ Scheduled credential refresh triggered');
        await this.refreshCredentials();
        console.log('✅ Scheduled credential refresh completed successfully');
      } catch (error) {
        console.error('❌ Scheduled credential refresh failed:', error.message);
        
        // If it's an Identity Center expiration, log helpful message
        if (error.message.includes('Identity Center credentials have expired')) {
          console.error('🔔 ACTION REQUIRED: Identity Center credentials need manual refresh in Operations Panel');
          // Try to recover by checking for valid cached credentials
          await this.attemptCredentialRecovery();
        }
        
        // Retry with exponential backoff
        this.scheduleRetryRefresh();
      }
    }, refreshInterval);

    const refreshTime = new Date(Date.now() + refreshInterval);
    console.log(`⏰ Next credential refresh scheduled for: ${refreshTime.toISOString()}`);
    console.log(`⏰ Refresh interval: ${Math.floor(refreshInterval / 1000 / 60)} minutes`);
  }

  /**
   * Schedule retry refresh with exponential backoff
   */
  scheduleRetryRefresh(attempt = 1) {
    const maxAttempts = 5;
    const baseDelay = 5 * 60 * 1000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 60 * 60 * 1000); // Max 1 hour
    
    if (attempt > maxAttempts) {
      console.error('🚨 Maximum credential refresh retry attempts reached. Manual intervention required.');
      return;
    }
    
    console.log(`⏰ Scheduling credential refresh retry #${attempt} in ${Math.floor(delay / 1000 / 60)} minutes`);
    
    setTimeout(async () => {
      try {
        await this.refreshCredentials();
        console.log('✅ Retry credential refresh succeeded');
      } catch (error) {
        console.error(`❌ Retry credential refresh #${attempt} failed:`, error.message);
        this.scheduleRetryRefresh(attempt + 1);
      }
    }, delay);
  }

  /**
   * Attempt to recover from credential expiration
   */
  async attemptCredentialRecovery() {
    try {
      console.log('🔄 Attempting credential recovery...');
      
      // Try to get SSO configuration and see if we can refresh
      const ssoConfig = await this.getStoredSSOConfig();
      if (ssoConfig && this.ssoCredentialProvider) {
        console.log('🔄 Attempting SSO credential recovery...');
        try {
          const credentials = await this.getCredentialsFromSSO();
          console.log('✅ SSO credential recovery successful');
          return credentials;
        } catch (ssoError) {
          console.warn('⚠️ SSO credential recovery failed:', ssoError.message);
        }
      }
      
      // Check if we have any fallback credentials
      const config = await this.getStoredAWSConfig();
      if (config && config.accessKey && config.secretKey) {
        console.log('🔄 Checking if stored credentials are still valid...');
        try {
          // Test credentials by making a simple AWS call
          const testCredentials = {
            accessKeyId: config.accessKey,
            secretAccessKey: config.secretKey,
            ...(config.sessionToken && { sessionToken: config.sessionToken })
          };
          
          // If we get here without error, credentials might still be valid
          this.cachedCredentials = testCredentials;
          this.credentialExpiry = Date.now() + (30 * 60 * 1000); // Give 30 minutes
          console.log('✅ Credential recovery attempt with stored credentials');
          return testCredentials;
        } catch (testError) {
          console.warn('⚠️ Stored credentials are no longer valid:', testError.message);
        }
      }
      
      console.error('❌ All credential recovery attempts failed');
      return null;
      
    } catch (error) {
      console.error('❌ Credential recovery process failed:', error.message);
      return null;
    }
  }

  /**
   * Force refresh credentials (for manual trigger)
   */
  async forceRefresh() {
    this.cachedCredentials = null;
    this.credentialExpiry = null;
    return await this.refreshCredentials();
  }

  /**
   * Get credential status for debugging
   */
  async getStatus() {
    const now = Date.now();
    const timeUntilExpiry = this.credentialExpiry ? this.credentialExpiry - now : null;
    
    // Get SSO configuration status
    const ssoConfig = await this.getStoredSSOConfig();
    const ssoTokenInfo = await this.getStoredSSOTokenInfo();
    
    let ssoStatus = {
      configured: !!ssoConfig,
      hasActiveToken: false,
      tokenExpiryTime: null,
      tokenTimeUntilExpiry: null
    };
    
    if (ssoTokenInfo) {
      const tokenAge = now - ssoTokenInfo.createdAt;
      const tokenExpiryTime = ssoTokenInfo.createdAt + (ssoTokenInfo.expiresIn * 1000);
      const tokenTimeUntilExpiry = tokenExpiryTime - now;
      
      ssoStatus = {
        ...ssoStatus,
        hasActiveToken: tokenTimeUntilExpiry > 0,
        tokenExpiryTime,
        tokenTimeUntilExpiry,
        tokenTimeUntilExpiryMinutes: Math.floor(tokenTimeUntilExpiry / 60000)
      };
    }
    
    return {
      hasCachedCredentials: !!this.cachedCredentials,
      credentialExpiry: this.credentialExpiry,
      timeUntilExpiry,
      timeUntilExpiryMinutes: timeUntilExpiry ? Math.floor(timeUntilExpiry / 60000) : null,
      isExpired: timeUntilExpiry ? timeUntilExpiry <= 0 : null,
      isNearExpiry: timeUntilExpiry ? timeUntilExpiry <= 300000 : null, // Within 5 minutes
      isRefreshing: this.isRefreshing,
      nextRefreshScheduled: !!this.refreshTimer,
      lastRefreshTime: this.credentialExpiry ? new Date(this.credentialExpiry - (55 * 60 * 1000)) : null,
      sso: ssoStatus,
      authMethod: ssoConfig ? 'SSO' : 'Manual',
      retryAttempts: this.retryAttempts,
      maxRetryAttempts: this.maxRetryAttempts,
      backgroundMonitoring: !!this.monitoringTimer
    };
  }

  /**
   * Start background monitoring system for proactive credential management
   */
  startBackgroundMonitoring() {
    // Clear existing monitoring timer
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    console.log('🔍 Starting background credential monitoring system...');
    
    // Check every 30 minutes
    const monitoringInterval = 30 * 60 * 1000; // 30 minutes
    
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('❌ Background monitoring error:', error.message);
      }
    }, monitoringInterval);
    
    // Perform initial check after 1 minute
    setTimeout(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('❌ Initial monitoring check error:', error.message);
      }
    }, 60000);
    
    console.log('✅ Background credential monitoring started (checks every 30 minutes)');
  }

  /**
   * Perform a monitoring check of credential status
   */
  async performMonitoringCheck() {
    const status = await this.getStatus();
    const now = Date.now();
    
    console.log(`🔍 Background monitoring check: ${new Date().toISOString()}`);
    console.log(`📊 Credential status: ${status.hasCachedCredentials ? 'CACHED' : 'NONE'}`);
    
    if (status.timeUntilExpiry) {
      const hoursUntilExpiry = Math.floor(status.timeUntilExpiry / (60 * 60 * 1000));
      const minutesUntilExpiry = Math.floor((status.timeUntilExpiry % (60 * 60 * 1000)) / (60 * 1000));
      console.log(`⏰ Time until expiry: ${hoursUntilExpiry}h ${minutesUntilExpiry}m`);
      
      // If credentials expire within 2 hours, trigger proactive refresh
      if (status.timeUntilExpiry <= (2 * 60 * 60 * 1000) && !this.isRefreshing) {
        console.log('🚨 Credentials expiring within 2 hours - triggering proactive refresh');
        try {
          await this.refreshCredentials();
          this.retryAttempts = 0; // Reset retry counter on success
          console.log('✅ Proactive credential refresh completed successfully');
        } catch (error) {
          console.error('❌ Proactive credential refresh failed:', error.message);
          this.retryAttempts++;
          
          // If we've failed too many times, try recovery
          if (this.retryAttempts >= this.maxRetryAttempts) {
            console.log('🔄 Max retry attempts reached, attempting credential recovery...');
            await this.attemptCredentialRecovery();
          }
        }
      }
      
      // If credentials expire within 30 minutes, try emergency refresh
      else if (status.timeUntilExpiry <= (30 * 60 * 1000) && !this.isRefreshing) {
        console.log('🚨 EMERGENCY: Credentials expiring within 30 minutes - emergency refresh');
        try {
          await this.forceRefresh();
          console.log('✅ Emergency credential refresh completed');
        } catch (error) {
          console.error('❌ Emergency credential refresh failed:', error.message);
          await this.attemptCredentialRecovery();
        }
      }
    } else if (!status.hasCachedCredentials) {
      console.log('⚠️ No cached credentials found - attempting to initialize');
      try {
        await this.getCredentials();
        console.log('✅ Credential initialization completed');
      } catch (error) {
        console.error('❌ Credential initialization failed:', error.message);
      }
    }
    
    // Log overall system health
    if (status.hasCachedCredentials && status.timeUntilExpiry > (60 * 60 * 1000)) {
      console.log('💚 Credential system healthy - no action needed');
    }
  }

  /**
   * Stop background monitoring (for cleanup)
   */
  stopBackgroundMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('🛑 Background credential monitoring stopped');
    }
  }
}

// Singleton instance
const credentialManager = new AWSCredentialManager();

export default credentialManager;
