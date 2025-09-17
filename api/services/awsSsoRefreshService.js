import { SSOClient, GetRoleCredentialsCommand } from "@aws-sdk/client-sso";
import { SSOOIDCClient, CreateTokenCommand } from "@aws-sdk/client-sso-oidc";
import { fromSSO } from '@aws-sdk/credential-provider-sso';
import { S3Client } from '@aws-sdk/client-s3';
import { STSClient } from '@aws-sdk/client-sts';
import { getDbPool } from '../db.js';

class AwsSsoRefreshService {
  constructor() {
    this.refreshTimer = null;
    this.isRefreshing = false;
  }

  /**
   * Start automatic credential refresh monitoring
   */
  async startAutoRefresh() {
    console.log('🔄 Starting AWS SSO auto-refresh monitoring...');
    
    // Check immediately on startup
    await this.checkAndRefreshCredentials();
    
    // Set up interval to check every 5 minutes
    this.refreshTimer = setInterval(async () => {
      await this.checkAndRefreshCredentials();
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('✅ AWS SSO auto-refresh monitoring started');
  }

  /**
   * Stop automatic refresh monitoring
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('🛑 AWS SSO auto-refresh monitoring stopped');
    }
  }

  /**
   * Check if credentials need refresh and refresh if necessary
   */
  async checkAndRefreshCredentials() {
    if (this.isRefreshing) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }

    try {
      const pool = getDbPool();
      const result = await pool.query("SELECT value FROM settings WHERE key = 'aws_config'");
      
      if (result.rows.length === 0) {
        console.log('ℹ️ No AWS configuration found, skipping refresh');
        return;
      }

      const config = JSON.parse(result.rows[0].value);
      
      // Check if auto-refresh is enabled and SSO is configured
      if (!config.autoRefreshEnabled || !config.ssoStartUrl || !config.accountId || !config.roleName) {
        console.log('ℹ️ Auto-refresh disabled or SSO not configured, skipping refresh');
        return;
      }

      // Check if credentials need refresh (refresh 30 minutes before expiration)
      if (config.expiresAt) {
        const expiresAt = new Date(config.expiresAt);
        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + (30 * 60 * 1000));
        
        if (expiresAt > thirtyMinutesFromNow) {
          console.log(`ℹ️ Credentials still valid until ${expiresAt.toISOString()}, no refresh needed`);
          return;
        }
      }

      console.log('🔄 Credentials need refresh, attempting automatic refresh...');
      await this.refreshCredentials(config);
      
    } catch (error) {
      console.error('❌ Error in auto-refresh check:', error);
    }
  }

  /**
   * Manually refresh credentials
   */
  async manualRefresh() {
    try {
      const pool = getDbPool();
      const result = await pool.query("SELECT value FROM settings WHERE key = 'aws_config'");
      
      if (result.rows.length === 0) {
        throw new Error('No AWS configuration found');
      }

      const config = JSON.parse(result.rows[0].value);
      
      if (!config.ssoStartUrl || !config.accountId || !config.roleName) {
        throw new Error('SSO configuration incomplete. Please configure SSO settings in the media panel.');
      }

      console.log('🔄 Starting manual credential refresh...');
      const result_creds = await this.refreshCredentials(config);
      console.log('✅ Manual credential refresh completed');
      return result_creds;
      
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      throw error;
    }
  }

  /**
   * Refresh credentials using AWS SSO
   */
  async refreshCredentials(config) {
    this.isRefreshing = true;
    
    try {
      console.log('🔄 Refreshing AWS SSO credentials...');
      
      // Use AWS SDK credential provider for SSO
      const credentials = await fromSSO({
        profile: 'blog-media', // We'll create this profile
        region: config.ssoRegion || 'eu-west-2',
        ssoAccountId: config.accountId,
        ssoRoleName: config.roleName,
        ssoRegion: config.ssoRegion || 'eu-west-2',
        ssoStartUrl: config.ssoStartUrl
      })();

      // Calculate expiration time (typically 12 hours for SSO credentials)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (12 * 60 * 60 * 1000)); // 12 hours from now

      // Update configuration with new credentials
      const updatedConfig = {
        ...config,
        accessKey: credentials.accessKeyId,
        secretKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
        expiresAt: expiresAt.toISOString(),
        lastRefresh: now.toISOString()
      };

      // Save to database
      const pool = getDbPool();
      await pool.query(
        "UPDATE settings SET value = $1 WHERE key = 'aws_config'",
        [JSON.stringify(updatedConfig)]
      );

      console.log('✅ AWS SSO credentials refreshed successfully');
      console.log(`ℹ️ New credentials expire at: ${expiresAt.toISOString()}`);
      
      return {
        success: true,
        expiresAt: expiresAt.toISOString(),
        message: 'Credentials refreshed successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to refresh AWS SSO credentials:', error);
      
      // If SSO requires re-authentication, provide helpful error
      if (error.message.includes('token') || error.message.includes('login')) {
        throw new Error('SSO session expired. Please run "aws sso login" on the server or provide fresh credentials manually.');
      }
      
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get current credential status
   */
  async getCredentialStatus() {
    try {
      const pool = getDbPool();
      const result = await pool.query("SELECT value FROM settings WHERE key = 'aws_config'");
      
      if (result.rows.length === 0) {
        return {
          configured: false,
          message: 'No AWS configuration found'
        };
      }

      const config = JSON.parse(result.rows[0].value);
      
      if (!config.accessKey) {
        return {
          configured: false,
          message: 'AWS credentials not configured'
        };
      }

      const now = new Date();
      let status = 'unknown';
      let timeRemaining = null;
      
      if (config.expiresAt) {
        const expiresAt = new Date(config.expiresAt);
        timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000 / 60)); // minutes
        
        if (expiresAt <= now) {
          status = 'expired';
        } else if (expiresAt <= new Date(now.getTime() + (30 * 60 * 1000))) {
          status = 'expiring_soon';
        } else {
          status = 'valid';
        }
      }

      return {
        configured: true,
        status,
        expiresAt: config.expiresAt,
        timeRemaining,
        autoRefreshEnabled: config.autoRefreshEnabled,
        lastRefresh: config.lastRefresh,
        ssoConfigured: !!(config.ssoStartUrl && config.accountId && config.roleName)
      };
      
    } catch (error) {
      console.error('❌ Error getting credential status:', error);
      return {
        configured: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new AwsSsoRefreshService();