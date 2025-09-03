import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { getDbPool } from '../db.js';

class AWSCredentialManager {
  constructor() {
    this.cachedCredentials = null;
    this.credentialExpiry = null;
    this.refreshTimer = null;
    this.isRefreshing = false;
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

    // Refresh credentials
    return await this.refreshCredentials();
  }

  /**
   * Refresh AWS credentials using stored Identity Center credentials
   */
  async refreshCredentials() {
    if (this.isRefreshing) {
      console.log('⏳ Credential refresh already in progress, waiting...');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isRefreshing && this.cachedCredentials) {
            clearInterval(checkInterval);
            resolve(this.cachedCredentials);
          }
        }, 100);
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
        throw new Error('No Identity Center bootstrap credentials configured');
      }

      let credentials;

      // If we have role configuration, use role assumption
      if (config.roleArn && config.externalId) {
        credentials = await this.assumeRole(config);
        console.log('✅ Successfully assumed role for credentials');
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
      this.credentialExpiry = Date.now() + (55 * 60 * 1000); // Expire in 55 minutes
      
      // Schedule next refresh for 11 hours if using Identity Center credentials
      if (config.sessionToken) {
        this.scheduleCredentialRefresh();
      }

      console.log('✅ AWS credentials refreshed successfully');
      return credentials;

    } catch (error) {
      console.error('❌ Failed to refresh AWS credentials:', error.message);
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
   * Schedule automatic credential refresh every 11 hours
   */
  scheduleCredentialRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule refresh for 11 hours (39,600 seconds)
    const refreshInterval = 11 * 60 * 60 * 1000; // 11 hours in milliseconds
    
    this.refreshTimer = setTimeout(async () => {
      try {
        console.log('⏰ Scheduled credential refresh triggered');
        await this.refreshCredentials();
      } catch (error) {
        console.error('❌ Scheduled credential refresh failed:', error.message);
        // Retry in 30 minutes
        setTimeout(() => this.scheduleCredentialRefresh(), 30 * 60 * 1000);
      }
    }, refreshInterval);

    console.log(`⏰ Next credential refresh scheduled in 11 hours`);
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
  getStatus() {
    return {
      hasCachedCredentials: !!this.cachedCredentials,
      credentialExpiry: this.credentialExpiry,
      timeUntilExpiry: this.credentialExpiry ? this.credentialExpiry - Date.now() : null,
      isRefreshing: this.isRefreshing,
      nextRefreshScheduled: !!this.refreshTimer
    };
  }
}

// Singleton instance
const credentialManager = new AWSCredentialManager();

export default credentialManager;
