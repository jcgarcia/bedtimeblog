import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getDbPool } from '../db.js';
import awsCredentialManager from '../services/awsCredentialManager.js';

// Sync S3 bucket contents with database
export const syncS3ToDatabase = async (req, res) => {
  try {
    const pool = getDbPool();
    
    // Get AWS configuration from database
    const settingsRes = await pool.query("SELECT key, value, type FROM settings WHERE key IN ('media_storage_type', 'aws_config')");
    const settings = {};
    settingsRes.rows.forEach(row => {
      if (row.type === 'json') {
        try { 
          settings[row.key] = JSON.parse(row.value); 
        } catch (e) { 
          console.error(`Error parsing JSON setting ${row.key}:`, e);
          settings[row.key] = {}; 
        }
      } else {
        settings[row.key] = row.value;
      }
    });

    if (settings.media_storage_type !== 'aws' || !settings.aws_config?.bucketName) {
      return res.status(400).json({
        success: false,
        message: 'AWS S3 not configured'
      });
    }

    // Get S3 client using OIDC authentication
    const credentials = await awsCredentialManager.getCredentials();
    const s3Client = new S3Client({
      region: settings.aws_config.region || 'eu-west-2',
      credentials
    });
    const bucketName = settings.aws_config.bucketName;

    // List all objects in S3 bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/' // Only sync files in uploads folder
    });

    const s3Objects = await s3Client.send(listCommand);
    
    if (!s3Objects.Contents || s3Objects.Contents.length === 0) {
      return res.json({
        success: true,
        message: 'No files found in S3 bucket',
        synced: 0
      });
    }

    // Get existing files from database
    const existingFiles = await pool.query('SELECT s3_key FROM media');
    const existingKeys = new Set(existingFiles.rows.map(row => row.s3_key));

    let syncedCount = 0;
    const syncResults = [];

    // Process each S3 object
    for (const obj of s3Objects.Contents) {
      if (existingKeys.has(obj.Key)) {
        syncResults.push({
          key: obj.Key,
          status: 'already_exists',
          message: 'File already in database'
        });
        continue;
      }

      try {
        // Extract filename from S3 key (e.g., "uploads/2025-09-03/file.png" -> "file.png")
        const pathParts = obj.Key.split('/');
        const filename = pathParts[pathParts.length - 1];
        
        // Try to extract original name (remove hash if present)
        let originalName = filename;
        const hashMatch = filename.match(/^(.+)-[a-f0-9]{8}\.(.+)$/);
        if (hashMatch) {
          originalName = `${hashMatch[1]}.${hashMatch[2]}`;
        }

        // Determine MIME type from extension
        const extension = filename.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        let fileType = extension;
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
          mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        } else if (['mp4', 'webm', 'mov'].includes(extension)) {
          mimeType = `video/${extension}`;
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
          mimeType = `audio/${extension}`;
        } else if (['pdf'].includes(extension)) {
          mimeType = 'application/pdf';
        }

        // Insert into database
        const insertQuery = `
          INSERT INTO media (
            filename, original_name, file_type, file_size, s3_key, s3_bucket,
            public_url, folder_path, tags, alt_text, uploaded_by, mime_type,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id
        `;

        const values = [
          filename,                                    // filename
          originalName,                               // original_name
          fileType,                                   // file_type
          obj.Size.toString(),                        // file_size
          obj.Key,                                    // s3_key
          bucketName,                                 // s3_bucket
          'private://s3-signed-url-required',         // public_url (placeholder for private bucket)
          '/',                                        // folder_path
          [],                                         // tags
          '',                                         // alt_text
          req.adminUser?.id || 1,                     // uploaded_by (fallback to admin user)
          mimeType,                                   // mime_type
          obj.LastModified || new Date(),             // created_at
          obj.LastModified || new Date()              // updated_at
        ];

        const result = await pool.query(insertQuery, values);
        
        syncedCount++;
        syncResults.push({
          key: obj.Key,
          status: 'synced',
          message: `Added to database with ID ${result.rows[0].id}`,
          filename: filename,
          originalName: originalName,
          size: obj.Size
        });

      } catch (error) {
        console.error(`Error syncing ${obj.Key}:`, error);
        syncResults.push({
          key: obj.Key,
          status: 'error',
          message: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Sync completed. ${syncedCount} files added to database.`,
      synced: syncedCount,
      total: s3Objects.Contents.length,
      results: syncResults
    });

  } catch (error) {
    console.error('S3 sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync S3 bucket with database',
      error: error.message
    });
  }
};

// OIDC-specific S3 sync function
export const syncS3ToDatabaseOIDC = async (req, res) => {
  try {
    const pool = getDbPool();
    
    // Get AWS configuration from database
    const settingsRes = await pool.query("SELECT key, value, type FROM settings WHERE key IN ('media_storage_type', 'aws_config')");
    const settings = {};
    settingsRes.rows.forEach(row => {
      if (row.type === 'json') {
        settings[row.key] = row.value; // Already parsed by PostgreSQL
      } else {
        settings[row.key] = row.value;
      }
    });

    if (settings.media_storage_type !== 'aws' || !settings.aws_config?.bucketName) {
      return res.status(400).json({
        success: false,
        message: 'AWS S3 not configured for OIDC'
      });
    }

    // Get S3 client using OIDC authentication
    const credentials = await awsCredentialManager.getCredentials();
    const s3Client = new S3Client({
      region: settings.aws_config.region || 'eu-west-2',
      credentials
    });
    const bucketName = settings.aws_config.bucketName;

    // List all objects in S3 bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/' // Only sync files in uploads folder
    });

    const s3Objects = await s3Client.send(listCommand);
    
    if (!s3Objects.Contents || s3Objects.Contents.length === 0) {
      return res.json({
        success: true,
        message: 'No files found in S3 bucket',
        synced: 0
      });
    }

    // Get existing files from database
    const existingFiles = await pool.query('SELECT s3_key FROM media');
    const existingKeys = new Set(existingFiles.rows.map(row => row.s3_key));

    let syncedCount = 0;
    const insertPromises = [];

    for (const obj of s3Objects.Contents) {
      if (!existingKeys.has(obj.Key)) {
        // Extract filename from S3 key
        const filename = obj.Key.split('/').pop();
        const originalName = filename;
        
        // Determine mime type based on file extension
        const ext = filename.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'pdf') mimeType = 'application/pdf';
        else if (['mp4', 'mov'].includes(ext)) mimeType = 'video/' + ext;

        // Extract folder path from S3 key
        const folderPath = obj.Key.substring(0, obj.Key.lastIndexOf('/') + 1) || '/';

        const insertPromise = pool.query(`
          INSERT INTO media (
            filename, original_name, file_path, file_size, mime_type,
            s3_key, s3_bucket, folder_path, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          filename,
          originalName,
          obj.Key,
          obj.Size || 0,
          mimeType,
          obj.Key,
          bucketName,
          folderPath
        ]);

        insertPromises.push(insertPromise);
        syncedCount++;
      }
    }

    // Execute all inserts
    await Promise.all(insertPromises);

    res.json({
      success: true,
      message: `OIDC sync completed successfully`,
      synced: syncedCount,
      total: s3Objects.Contents.length
    });

  } catch (error) {
    console.error('Error syncing S3 with OIDC:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing S3 bucket with database using OIDC'
    });
  }
};
