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
    const { host, port, user, password, secure } = req.body;

    if (!host || !port || !user || !password) {
      return res.status(400).json({ 
        error: "All SMTP fields are required for testing" 
      });
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
