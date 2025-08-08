-- Add OAuth settings to the settings table
-- These settings will store OAuth credentials for social media login functionality

INSERT INTO settings (key, value, type, group_name, description, is_public) VALUES
('oauth_google_client_id', '', 'string', 'oauth', 'Google OAuth Client ID', FALSE),
('oauth_google_client_secret', '', 'string', 'oauth', 'Google OAuth Client Secret', FALSE),
('oauth_facebook_app_id', '', 'string', 'oauth', 'Facebook OAuth App ID', FALSE),
('oauth_facebook_app_secret', '', 'string', 'oauth', 'Facebook OAuth App Secret', FALSE),
('oauth_twitter_consumer_key', '', 'string', 'oauth', 'Twitter OAuth Consumer Key', FALSE),
('oauth_twitter_consumer_secret', '', 'string', 'oauth', 'Twitter OAuth Consumer Secret', FALSE),
('oauth_frontend_url', 'https://blog.ingasti.com', 'string', 'oauth', 'Frontend URL for OAuth callbacks', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Display results
SELECT 'OAuth settings created successfully' AS status;
SELECT key, value, description FROM settings WHERE group_name = 'oauth';
