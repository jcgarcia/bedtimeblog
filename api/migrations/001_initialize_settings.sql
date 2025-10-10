-- Migration: Initialize settings table with OIDC configuration
-- Purpose: Fix missing system settings that caused media URL generation failure
-- Date: 2025-10-10
-- Context: After database recreation, the settings table was missing critical AWS/OIDC config

BEGIN;

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert AWS/OIDC configuration if it doesn't exist
INSERT INTO settings (key, value, description) 
VALUES (
    'aws_config',
    '{"authMethod":"oidc","region":"eu-west-2","bucketName":"bedtimeblog-medialibrary","roleArn":"arn:aws:iam::007041844937:role/BedtimeBlogMediaRole","oidcIssuerUrl":"https://oidc.ingasti.com","oidcAudience":"https://oidc.ingasti.com","oidcSubject":"system:serviceaccount:blog:media-access-sa"}',
    'AWS S3 configuration with OIDC authentication'
) ON CONFLICT (key) DO NOTHING;

-- Insert other essential system settings if needed
INSERT INTO settings (key, value, description) 
VALUES 
    ('system.version', '1.0.0', 'Application version'),
    ('system.environment', 'production', 'Application environment'),
    ('media.max_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)')
ON CONFLICT (key) DO NOTHING;

COMMIT;