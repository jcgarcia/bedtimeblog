import { getDbPool } from "../db.js";

const pool = getDbPool();

// Get all public settings
export const getSettings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value, type FROM settings WHERE is_public = true ORDER BY key"
    );
    
    // Convert settings array to object for easier frontend use
    const settings = {};
    result.rows.forEach(row => {
      let value = row.value;
      
      // Parse value based on type
      if (row.type === 'boolean') {
        value = value === 'true';
      } else if (row.type === 'number') {
        value = parseFloat(value);
      } else if (row.type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error(`Error parsing JSON setting ${row.key}:`, e);
        }
      }
      
      settings[row.key] = value;
    });
    
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Error fetching settings" });
  }
};

// Get all settings including admin-only ones (admin only)
export const getAllSettings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value, type, group_name, description, is_public FROM settings ORDER BY group_name, key"
    );
    
    // Convert settings array to object for easier frontend use
    const settings = {};
    result.rows.forEach(row => {
      let value = row.value;
      
      // Parse value based on type
      if (row.type === 'boolean') {
        value = value === 'true';
      } else if (row.type === 'number') {
        value = parseFloat(value);
      } else if (row.type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error(`Error parsing JSON setting ${row.key}:`, e);
        }
      }
      
      // Use camelCase for frontend
      const camelKey = row.key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      settings[camelKey] = value;
    });
    
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching all settings:", error);
    res.status(500).json({ message: "Error fetching settings" });
  }
};

// Update settings (admin only - basic version)
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      let stringValue = value;
      let type = 'string';
      
      // Determine type
      if (typeof value === 'boolean') {
        type = 'boolean';
        stringValue = value.toString();
      } else if (typeof value === 'number') {
        type = 'number';
        stringValue = value.toString();
      } else if (typeof value === 'object') {
        type = 'json';
        stringValue = JSON.stringify(value);
      }
      
      await pool.query(
        `INSERT INTO settings (key, value, type, is_public, updated_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET 
           value = $2, 
           type = $3, 
           updated_at = CURRENT_TIMESTAMP`,
        [key, stringValue, type, true]
      );
    }
    
    res.status(200).json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Error updating settings" });
  }
};

// Get social media links
export const getSocialMediaLinks = async (req, res) => {
  try {
    const socialKeys = [
      'social_facebook_url',
      'social_twitter_url', 
      'social_instagram_url',
      'social_threads_url'
    ];
    
    const result = await pool.query(
      "SELECT key, value FROM settings WHERE key = ANY($1)",
      [socialKeys]
    );
    
    const socialLinks = {
      facebook: '',
      twitter: '',
      instagram: '',
      threads: ''
    };
    
    result.rows.forEach(row => {
      switch (row.key) {
        case 'social_facebook_url':
          socialLinks.facebook = row.value || '';
          break;
        case 'social_twitter_url':
          socialLinks.twitter = row.value || '';
          break;
        case 'social_instagram_url':
          socialLinks.instagram = row.value || '';
          break;
        case 'social_threads_url':
          socialLinks.threads = row.value || '';
          break;
      }
    });
    
    res.status(200).json(socialLinks);
  } catch (error) {
    console.error("Error fetching social media links:", error);
    res.status(500).json({ message: "Error fetching social media links" });
  }
};

// Update social media links
export const updateSocialMediaLinks = async (req, res) => {
  try {
    const { facebook, twitter, instagram, threads } = req.body;
    
    const updates = [
      { key: 'social_facebook_url', value: facebook || '' },
      { key: 'social_twitter_url', value: twitter || '' },
      { key: 'social_instagram_url', value: instagram || '' },
      { key: 'social_threads_url', value: threads || '' }
    ];
    
    for (const update of updates) {
      await pool.query(
        `INSERT INTO settings (key, value, type, group_name, description, is_public, updated_at) 
         VALUES ($1, $2, 'string', 'social', $3, true, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET 
           value = $2, 
           updated_at = CURRENT_TIMESTAMP`,
        [
          update.key, 
          update.value,
          `URL for ${update.key.replace('social_', '').replace('_url', '')} social media profile`
        ]
      );
    }
    
    res.status(200).json({ 
      message: "Social media links updated successfully",
      links: { facebook, twitter, instagram, threads }
    });
  } catch (error) {
    console.error("Error updating social media links:", error);
    res.status(500).json({ message: "Error updating social media links" });
  }
};

// Get OAuth configuration (admin only)
export const getOAuthSettings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM settings WHERE group_name = 'oauth' ORDER BY key"
    );
    
    const oauthConfig = {
      google: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        redirectUri: ''
      },
      facebook: {
        enabled: false,
        appId: '',
        appSecret: '',
        redirectUri: ''
      },
      twitter: {
        enabled: false,
        consumerKey: '',
        consumerSecret: '',
        callbackUrl: ''
      }
    };
    
    // Map database values to structure
    result.rows.forEach(row => {
      switch (row.key) {
        case 'oauth_google_client_id':
          oauthConfig.google.clientId = row.value || '';
          oauthConfig.google.enabled = !!(row.value && row.value.trim());
          break;
        case 'oauth_google_client_secret':
          oauthConfig.google.clientSecret = row.value || '';
          break;
        case 'oauth_facebook_app_id':
          oauthConfig.facebook.appId = row.value || '';
          oauthConfig.facebook.enabled = !!(row.value && row.value.trim());
          break;
        case 'oauth_facebook_app_secret':
          oauthConfig.facebook.appSecret = row.value || '';
          break;
        case 'oauth_twitter_consumer_key':
          oauthConfig.twitter.consumerKey = row.value || '';
          oauthConfig.twitter.enabled = !!(row.value && row.value.trim());
          break;
        case 'oauth_twitter_consumer_secret':
          oauthConfig.twitter.consumerSecret = row.value || '';
          break;
        case 'oauth_frontend_url':
          // Set redirect URIs based on frontend URL
          const baseUrl = row.value || 'https://blog.ingasti.com';
          oauthConfig.google.redirectUri = `${baseUrl}/auth/google/callback`;
          oauthConfig.facebook.redirectUri = `${baseUrl}/auth/facebook/callback`;
          oauthConfig.twitter.callbackUrl = `${baseUrl}/auth/twitter/callback`;
          break;
      }
    });
    
    res.status(200).json({
      success: true,
      config: oauthConfig
    });
  } catch (error) {
    console.error("Error fetching OAuth settings:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching OAuth configuration" 
    });
  }
};

// Update OAuth configuration (admin only)
export const updateOAuthSettings = async (req, res) => {
  try {
    const { google, facebook, twitter } = req.body;
    
    if (!google && !facebook && !twitter) {
      return res.status(400).json({
        success: false,
        message: 'No OAuth configuration provided'
      });
    }
    
    const updates = [];
    
    // Process Google config
    if (google) {
      updates.push(
        { key: 'oauth_google_client_id', value: google.clientId || '' },
        { key: 'oauth_google_client_secret', value: google.clientSecret || '' }
      );
    }
    
    // Process Facebook config
    if (facebook) {
      updates.push(
        { key: 'oauth_facebook_app_id', value: facebook.appId || '' },
        { key: 'oauth_facebook_app_secret', value: facebook.appSecret || '' }
      );
    }
    
    // Process Twitter config
    if (twitter) {
      updates.push(
        { key: 'oauth_twitter_consumer_key', value: twitter.consumerKey || '' },
        { key: 'oauth_twitter_consumer_secret', value: twitter.consumerSecret || '' }
      );
    }
    
    // Update database
    for (const update of updates) {
      await pool.query(
        `UPDATE settings SET 
           value = $1, 
           updated_at = CURRENT_TIMESTAMP
         WHERE key = $2`,
        [update.value, update.key]
      );
    }
    
    res.status(200).json({
      success: true,
      message: "OAuth configuration updated successfully"
    });
  } catch (error) {
    console.error("Error updating OAuth settings:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating OAuth configuration" 
    });
  }
};
