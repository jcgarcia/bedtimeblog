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
import { query } from "../db.js";

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
