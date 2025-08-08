import { getDbPool } from "../db.js";

// Helper function to execute queries
const query = async (text, params) => {
  const pool = getDbPool();
  return await pool.query(text, params);
};

// Get social media links
export const getSocialMediaLinks = async (req, res) => {
  try {
    const result = await query(
      `SELECT key, value FROM settings 
       WHERE key IN ('social_facebook_url', 'social_twitter_url', 'social_instagram_url', 'social_threads_url')`
    );

    const socialLinks = {
      facebook: "",
      twitter: "",
      instagram: "",
      threads: ""
    };

    result.rows.forEach(row => {
      switch(row.key) {
        case 'social_facebook_url':
          socialLinks.facebook = row.value || "";
          break;
        case 'social_twitter_url':
          socialLinks.twitter = row.value || "";
          break;
        case 'social_instagram_url':
          socialLinks.instagram = row.value || "";
          break;
        case 'social_threads_url':
          socialLinks.threads = row.value || "";
          break;
      }
    });

    res.json(socialLinks);
  } catch (error) {
    console.error("Error fetching social media links:", error);
    res.status(500).json({ error: "Failed to fetch social media links" });
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
      await query(
        `INSERT INTO settings (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
        [update.key, update.value]
      );
    }

    res.json({
      message: "Social media links updated successfully",
      links: { facebook, twitter, instagram, threads }
    });
  } catch (error) {
    console.error("Error updating social media links:", error);
    res.status(500).json({ error: "Failed to update social media links" });
  }
};

// Get contact settings
export const getContactSettings = async (req, res) => {
  try {
    const result = await query(
      `SELECT key, value FROM settings 
       WHERE key IN ('contact_email')`
    );

    const contactSettings = {
      email: "blog@ingasti.com" // default value
    };

    result.rows.forEach(row => {
      if (row.key === 'contact_email') {
        contactSettings.email = row.value || "blog@ingasti.com";
      }
    });

    res.json(contactSettings);
  } catch (error) {
    console.error("Error fetching contact settings:", error);
    res.status(500).json({ error: "Failed to fetch contact settings" });
  }
};

// Update contact settings
export const updateContactSettings = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    await query(
      `INSERT INTO settings (key, value, updated_at) 
       VALUES ('contact_email', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) 
       DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [email]
    );

    res.json({
      message: "Contact email updated successfully",
      email: email
    });
  } catch (error) {
    console.error("Error updating contact email:", error);
    res.status(500).json({ error: "Failed to update contact email" });
  }
};

// Get SMTP settings
export const getSmtpSettings = async (req, res) => {
  try {
    const result = await query(
      `SELECT key, value FROM settings 
       WHERE key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_secure')`
    );

    const smtpSettings = {
      host: "smtp.gmail.com",
      port: "587",
      user: "",
      password: "",
      from: "",
      secure: false
    };

    result.rows.forEach(row => {
      switch(row.key) {
        case 'smtp_host':
          smtpSettings.host = row.value || "smtp.gmail.com";
          break;
        case 'smtp_port':
          smtpSettings.port = row.value || "587";
          break;
        case 'smtp_user':
          smtpSettings.user = row.value || "";
          break;
        case 'smtp_pass':
          smtpSettings.password = row.value || "";
          break;
        case 'smtp_from':
          smtpSettings.from = row.value || "";
          break;
        case 'smtp_secure':
          smtpSettings.secure = row.value === 'true';
          break;
      }
    });

    // Don't send the password in the response for security
    res.json({
      ...smtpSettings,
      password: smtpSettings.password ? "••••••••" : ""
    });
  } catch (error) {
    console.error("Error fetching SMTP settings:", error);
    res.status(500).json({ error: "Failed to fetch SMTP settings" });
  }
};

// Update SMTP settings
export const updateSmtpSettings = async (req, res) => {
  try {
    const { host, port, user, password, from, secure } = req.body;

    // Validate required fields
    if (!host || !port || !user) {
      return res.status(400).json({ 
        error: "Host, port, and username are required" 
      });
    }

    // Validate email format for user and from fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user)) {
      return res.status(400).json({ error: "Please provide a valid email address for SMTP user" });
    }
    if (from && !emailRegex.test(from)) {
      return res.status(400).json({ error: "Please provide a valid email address for From field" });
    }

    // Validate port is a number
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return res.status(400).json({ error: "Port must be a valid number between 1 and 65535" });
    }

    const updates = [
      { key: 'smtp_host', value: host },
      { key: 'smtp_port', value: port.toString() },
      { key: 'smtp_user', value: user },
      { key: 'smtp_from', value: from || user },
      { key: 'smtp_secure', value: secure ? 'true' : 'false' }
    ];

    // Only update password if it's provided and not the masked value
    if (password && password !== "••••••••") {
      updates.push({ key: 'smtp_pass', value: password });
    }

    for (const update of updates) {
      await query(
        `INSERT INTO settings (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
        [update.key, update.value]
      );
    }

    res.json({
      message: "SMTP settings updated successfully",
      settings: {
        host,
        port,
        user,
        from: from || user,
        secure,
        password: password && password !== "••••••••" ? "Updated" : "Not changed"
      }
    });
  } catch (error) {
    console.error("Error updating SMTP settings:", error);
    res.status(500).json({ error: "Failed to update SMTP settings" });
  }
};

// Test SMTP connection
export const testSmtpConnection = async (req, res) => {
  try {
    let { host, port, user, password, secure } = req.body;

    if (!host || !port || !user || !password) {
      return res.status(400).json({ 
        error: "All SMTP fields are required for testing" 
      });
    }

    // If password is masked, get the real password from database
    if (password === "••••••••") {
      const passwordResult = await query(
        `SELECT value FROM settings WHERE key = 'smtp_pass'`
      );
      if (passwordResult.rows.length > 0 && passwordResult.rows[0].value) {
        password = passwordResult.rows[0].value;
      } else {
        return res.status(400).json({ 
          error: "No password stored in database. Please enter the password." 
        });
      }
    }

    // Import nodemailer dynamically
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(port),
      secure: secure || false,
      auth: {
        user,
        pass: password
      },
    });

    // Verify the connection
    await transporter.verify();

    res.json({
      success: true,
      message: "SMTP connection test successful!"
    });
  } catch (error) {
    console.error("SMTP test error:", error);
    res.status(400).json({
      success: false,
      error: "SMTP connection test failed",
      details: error.message
    });
  }
};


// Get OAuth settings
export const getOAuthSettings = async (req, res) => {
  try {
    const result = await query(
      `SELECT key, value FROM settings 
       WHERE key IN (
         'oauth_google_client_id', 'oauth_google_client_secret',
         'oauth_facebook_app_id', 'oauth_facebook_app_secret',
         'oauth_twitter_consumer_key', 'oauth_twitter_consumer_secret',
         'oauth_frontend_url'
       )`
    );

    const oauthSettings = {
      google: {
        clientId: "",
        clientSecret: "",
        configured: false
      },
      facebook: {
        appId: "",
        appSecret: "",
        configured: false
      },
      twitter: {
        consumerKey: "",
        consumerSecret: "",
        configured: false
      },
      frontendUrl: "https://blog.ingasti.com"
    };

    result.rows.forEach(row => {
      switch(row.key) {
        case 'oauth_google_client_id':
          oauthSettings.google.clientId = row.value ? "••••••••" : "";
          oauthSettings.google.configured = !!row.value;
          break;
        case 'oauth_google_client_secret':
          oauthSettings.google.clientSecret = row.value ? "••••••••" : "";
          break;
        case 'oauth_facebook_app_id':
          oauthSettings.facebook.appId = row.value ? "••••••••" : "";
          oauthSettings.facebook.configured = !!row.value;
          break;
        case 'oauth_facebook_app_secret':
          oauthSettings.facebook.appSecret = row.value ? "••••••••" : "";
          break;
        case 'oauth_twitter_consumer_key':
          oauthSettings.twitter.consumerKey = row.value ? "••••••••" : "";
          oauthSettings.twitter.configured = !!row.value;
          break;
        case 'oauth_twitter_consumer_secret':
          oauthSettings.twitter.consumerSecret = row.value ? "••••••••" : "";
          break;
        case 'oauth_frontend_url':
          oauthSettings.frontendUrl = row.value || "https://blog.ingasti.com";
          break;
      }
    });

    // Update configured status based on both credentials being present
    const googleResult = await query(
      `SELECT COUNT(*) as count FROM settings 
       WHERE key IN ('oauth_google_client_id', 'oauth_google_client_secret') 
       AND value IS NOT NULL AND value != ''`
    );
    oauthSettings.google.configured = parseInt(googleResult.rows[0].count) === 2;

    const facebookResult = await query(
      `SELECT COUNT(*) as count FROM settings 
       WHERE key IN ('oauth_facebook_app_id', 'oauth_facebook_app_secret') 
       AND value IS NOT NULL AND value != ''`
    );
    oauthSettings.facebook.configured = parseInt(facebookResult.rows[0].count) === 2;

    const twitterResult = await query(
      `SELECT COUNT(*) as count FROM settings 
       WHERE key IN ('oauth_twitter_consumer_key', 'oauth_twitter_consumer_secret') 
       AND value IS NOT NULL AND value != ''`
    );
    oauthSettings.twitter.configured = parseInt(twitterResult.rows[0].count) === 2;

    res.json(oauthSettings);
  } catch (error) {
    console.error("Error fetching OAuth settings:", error);
    res.status(500).json({ error: "Failed to fetch OAuth settings" });
  }
};

// Update OAuth settings
export const updateOAuthSettings = async (req, res) => {
  try {
    const { google, facebook, twitter, frontendUrl } = req.body;

    const updates = [];

    // Add frontend URL
    if (frontendUrl) {
      updates.push({ key: 'oauth_frontend_url', value: frontendUrl });
    }

    // Add Google OAuth settings
    if (google) {
      if (google.clientId && google.clientId !== "••••••••") {
        updates.push({ key: 'oauth_google_client_id', value: google.clientId });
      }
      if (google.clientSecret && google.clientSecret !== "••••••••") {
        updates.push({ key: 'oauth_google_client_secret', value: google.clientSecret });
      }
    }

    // Add Facebook OAuth settings
    if (facebook) {
      if (facebook.appId && facebook.appId !== "••••••••") {
        updates.push({ key: 'oauth_facebook_app_id', value: facebook.appId });
      }
      if (facebook.appSecret && facebook.appSecret !== "••••••••") {
        updates.push({ key: 'oauth_facebook_app_secret', value: facebook.appSecret });
      }
    }

    // Add Twitter OAuth settings
    if (twitter) {
      if (twitter.consumerKey && twitter.consumerKey !== "••••••••") {
        updates.push({ key: 'oauth_twitter_consumer_key', value: twitter.consumerKey });
      }
      if (twitter.consumerSecret && twitter.consumerSecret !== "••••••••") {
        updates.push({ key: 'oauth_twitter_consumer_secret', value: twitter.consumerSecret });
      }
    }

    // Perform all updates
    for (const update of updates) {
      await query(
        `INSERT INTO settings (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
        [update.key, update.value]
      );
    }

    res.json({
      message: "OAuth settings updated successfully",
      updated: updates.map(u => u.key)
    });
  } catch (error) {
    console.error("Error updating OAuth settings:", error);
    res.status(500).json({ error: "Failed to update OAuth settings" });
  }
};

// Test OAuth configuration
export const testOAuthConfiguration = async (req, res) => {
  try {
    const { provider } = req.params;
    
    // Get the current OAuth settings for the provider
    let keys = [];
    switch(provider) {
      case 'google':
        keys = ['oauth_google_client_id', 'oauth_google_client_secret'];
        break;
      case 'facebook':
        keys = ['oauth_facebook_app_id', 'oauth_facebook_app_secret'];
        break;
      case 'twitter':
        keys = ['oauth_twitter_consumer_key', 'oauth_twitter_consumer_secret'];
        break;
      default:
        return res.status(400).json({ error: "Invalid OAuth provider" });
    }

    const result = await query(
      `SELECT key, value FROM settings WHERE key = ANY($1::text[])`,
      [keys]
    );

    if (result.rows.length !== 2) {
      return res.status(400).json({
        success: false,
        error: `${provider} OAuth credentials are not fully configured`
      });
    }

    // Check if values are not empty
    if (hasEmptyValues) {
      return res.status(400).json({
        success: false,
        error: `${provider} OAuth credentials contain empty values`
      });
    }

    // For now, just validate that credentials exist
    // In a real implementation, you might want to make a test API call
    res.json({
      success: true,
      message: `${provider} OAuth configuration appears valid`,
      provider: provider
    });

  } catch (error) {
    console.error(`Error testing ${req.params.provider} OAuth:`, error);
    res.status(500).json({
      success: false,
      error: "Failed to test OAuth configuration",
      details: error.message
    });
  }
};
