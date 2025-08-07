import { query } from "../db.js";

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
