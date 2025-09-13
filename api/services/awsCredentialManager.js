import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { SSOClient, GetRoleCredentialsCommand } from '@aws-sdk/client-sso';
import { SSOOIDCClient, CreateTokenCommand } from '@aws-sdk/client-sso-oidc';
import { getDbPool } from '../db.js';
import crypto from 'crypto';

class AWSCredentialManager {
  constructor() {
    this.cachedCredentials = null;
    this.credentialExpiry = null;
    this.refreshTimer = null;
    this.isRefreshing = false;
    this.ssoTokenInfo = null; // Store SSO token information
    this.deviceAuthInfo = null; // Store device authorization info
  }

  /**
   * Initialize SSO session for automatic credential refresh
   */
  async initializeSSOSession(ssoConfig) {
    try {
      console.log('🔄 Initializing AWS SSO session for automatic refresh...');
      
      const { startUrl, region, accountId, roleName } = ssoConfig;
      
      if (!startUrl || !region || !accountId || !roleName) {
        throw new Error('Missing required SSO configuration: startUrl, region, accountId, roleName');
      }

      // Store SSO configuration
      await this.storeSSOConfig(ssoConfig);
      
      // Start device authorization flow
      const deviceAuth = await this.initiateDeviceAuthorization(startUrl, region);
      this.deviceAuthInfo = deviceAuth;
      
      console.log(`🔗 Complete SSO authorization: ${deviceAuth.verificationUriComplete}`);
      console.log(`📋 User code: ${deviceAuth.userCode}`);
      console.log(`⏰ Authorization expires in: ${deviceAuth.expiresIn} seconds`);
      
      return {
        success: true,
        authorizationUrl: deviceAuth.verificationUriComplete,
        userCode: deviceAuth.userCode,
        expiresIn: deviceAuth.expiresIn
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize SSO session:', error.message);
      throw error;
    }
  }

  /**
   * Complete SSO authorization and get initial tokens
   */
  async completeSSOAuthorization() {
    try {
      if (!this.deviceAuthInfo) {
        throw new Error('No device authorization in progress');
      }

      console.log('🔄 Completing SSO authorization...');
      
      const config = await this.getStoredSSOConfig();
      const { startUrl, region } = config;
      
      const ssoOIDCClient = new SSOOIDCClient({ region });
      
      const tokenCommand = new CreateTokenCommand({
        clientId: this.deviceAuthInfo.clientId,
        clientSecret: this.deviceAuthInfo.clientSecret,
        grantType: 'urn:ietf:params:oauth:grant-type:device_code',
        deviceCode: this.deviceAuthInfo.deviceCode
      });
      
      const tokenResponse = await ssoOIDCClient.send(tokenCommand);
      
      // Store token information
      this.ssoTokenInfo = {
        accessToken: tokenResponse.accessToken,
        expiresIn: tokenResponse.expiresIn,
        refreshToken: tokenResponse.refreshToken,
        tokenType: tokenResponse.tokenType,
        createdAt: Date.now()
      };
      
      await this.storeSSOTokenInfo(this.ssoTokenInfo);
      
      // Get initial credentials
      await this.refreshCredentialsFromSSO();
      
      // Schedule automatic refresh
      this.scheduleSSORenewal();
      
      console.log('✅ SSO authorization completed successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to complete SSO authorization:', error.message);
      throw error;
    }
  }
  /**
   * Get valid AWS credentials, refreshing if necessary
   */
  async getCredentials() {
    // If we have valid cached credentials, return them
    if (this.cachedCredentials && this.credentialExpiry && Date.now() < this.credentialExpiry - 300000) {
      console.log('✅ Using cached AWS credentials');
      return this.cachedCredentials;
    }

    // Check if we have SSO configuration
    const ssoConfig = await this.getStoredSSOConfig();
    if (ssoConfig && ssoConfig.startUrl) {
      // Use SSO-based refresh
      return await this.refreshCredentialsFromSSO();
    } else {
      // Fallback to legacy refresh
      return await this.refreshCredentials();
    }
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
   * Schedule automatic credential refresh
   */
  scheduleCredentialRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Calculate refresh interval based on expiry time
    const timeUntilExpiry = this.credentialExpiry - Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry
    const refreshInterval = Math.max(timeUntilExpiry - refreshBuffer, 60000); // At least 1 minute
    
    this.refreshTimer = setTimeout(async () => {
      try {
        console.log('⏰ Scheduled credential refresh triggered');
        await this.refreshCredentials();
      } catch (error) {
        console.error('❌ Scheduled credential refresh failed:', error.message);
        
        // If it's an Identity Center expiration, log helpful message
        if (error.message.includes('Identity Center credentials have expired')) {
          console.error('🔔 ACTION REQUIRED: Identity Center credentials need manual refresh in Operations Panel');
        }
        
        // Retry in 5 minutes for other errors
        setTimeout(() => this.scheduleCredentialRefresh(), 5 * 60 * 1000);
      }
    }, refreshInterval);

    const refreshTime = new Date(Date.now() + refreshInterval);
    console.log(`⏰ Next credential refresh scheduled for: ${refreshTime.toISOString()}`);
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
      authMethod: ssoConfig ? 'SSO' : 'Manual'
    };
  }
}

// Singleton instance
const credentialManager = new AWSCredentialManager();

export default credentialManager;
