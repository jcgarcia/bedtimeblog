import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { getDbPool } from '../db.js';
import jwt from 'jsonwebtoken';
import credentialManager from '../services/awsCredentialManager.js';

// Helper: Get S3 Client with automatic credential management
async function getS3Client(config) {
  try {
    console.log('🔑 Getting S3 client with automatic credential management');
    
    // Get fresh credentials from the credential manager
    const credentials = await credentialManager.getCredentials();
    
    return new S3Client({
      region: config.region,
      credentials: credentials,
      forcePathStyle: true
    });
  } catch (error) {
    console.error('❌ Failed to get S3 client:', error.message);
    throw new Error(`S3 client configuration failed: ${error.message}`);
  }
}

// Helper: Generate signed URL for private S3 objects
async function generateSignedUrl(s3Key, bucketName, expiresIn = 3600) {
  try {
    // Get AWS config from database
    const pool = getDbPool();
    const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'aws_config'");
    
    if (settingsRes.rows.length === 0) {
      throw new Error('AWS configuration not found');
    }
    
    const awsConfig = JSON.parse(settingsRes.rows[0].value);
    const s3Client = await getS3Client(awsConfig);
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter - checking file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      encoding: file.encoding,
      fieldname: file.fieldname
    });
    
    // Allowed file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                         'application/pdf', 'video/mp4', 'video/quicktime'];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log('✅ File type allowed:', file.mimetype);
      cb(null, true);
    } else {
      console.log('❌ File type rejected:', file.mimetype, 'not in', allowedTypes);
      cb(new Error('Invalid file type. Only images, PDFs, and videos are allowed.'), false);
    }
  },
}).single('file');

// Generate S3 key for file
const generateS3Key = (originalName, userId, folderPath = '/') => {
  const fileExtension = path.extname(originalName);
  const baseName = path.basename(originalName, fileExtension);
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const uniqueId = uuidv4().substring(0, 8);
  
  // Create folder structure: /uploads/YYYY-MM-DD/filename-uniqueid.ext
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const filename = `${sanitizedBaseName}-${uniqueId}${fileExtension}`;
  
  if (folderPath === '/' || !folderPath) {
    return `uploads/${timestamp}/${filename}`;
  } else {
    return `uploads/${folderPath.replace(/^\/+|\/+$/g, '')}/${timestamp}/${filename}`;
  }
};

// Get file dimensions for images
const getImageDimensions = async (buffer, mimetype) => {
  if (!mimetype.startsWith('image/')) {
    return { width: null, height: null };
  }
  
  try {
    // You can use sharp library for better image processing
    // For now, we'll return null and handle dimensions on the frontend
    return { width: null, height: null };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return { width: null, height: null };
  }
};

// Upload file to S3
export const uploadToS3 = async (req, res) => {
  try {
    // Use admin authentication (req.adminUser is set by requireAdminAuth middleware)
    const userId = req.adminUser?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    // Use the upload middleware directly - it's already configured for single file
    console.log('🔍 DEBUG: upload object:', typeof upload, Object.keys(upload));
    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ success: false, message: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }

      const file = req.file;
      const folderPath = req.body.folderPath || '/';
      const altText = req.body.altText || '';
      const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];

      // --- NEW: Read storage settings from DB ---
      const pool = getDbPool();
      const settingsRes = await pool.query("SELECT key, value, type FROM settings WHERE key IN ('media_storage_type', 'oci_config', 'aws_config')");
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
      
      // DEBUG: Log storage configuration
      console.log('🔍 Media Upload Debug - Storage Settings:');
      console.log('  media_storage_type:', settings.media_storage_type);
      console.log('  aws_config exists:', !!settings.aws_config);
      console.log('  aws_config.roleArn:', settings.aws_config?.roleArn);
      console.log('  aws_config.bucketName:', settings.aws_config?.bucketName);
      
      const storageType = settings.media_storage_type || 'oci';
      let s3, BUCKET_NAME, CDN_URL;
      
      if (storageType === 'aws' && settings.aws_config) {
        // Use automated credential management for AWS
        try {
          s3 = await getS3Client(settings.aws_config);
          BUCKET_NAME = settings.aws_config.bucketName;
          CDN_URL = settings.aws_config.cdnUrl || `https://${settings.aws_config.bucketName}.s3.${settings.aws_config.region}.amazonaws.com`;
        } catch (awsError) {
          console.error('AWS S3 configuration failed:', awsError.message);
          return res.status(500).json({ 
            success: false, 
            message: `AWS credentials error: ${awsError.message}. Please check Operations Panel configuration.` 
          });
        }
      } else if (settings.oci_config && settings.oci_config.bucket) {
        // OCI or other provider
        s3 = new S3Client({
          credentials: {
            accessKeyId: settings.oci_config.accessKey,
            secretAccessKey: settings.oci_config.secretKey,
          },
          region: settings.oci_config.region,
          endpoint: settings.oci_config.endpoint || undefined,
          forcePathStyle: true
        });
        BUCKET_NAME = settings.oci_config.bucket;
        CDN_URL = settings.oci_config.endpoint || '';
      } else {
        // No valid storage configuration
        console.error('No valid storage configuration found');
        return res.status(500).json({ 
          success: false, 
          message: 'No valid storage configuration found. Please configure AWS S3 or OCI Object Storage in Operations Center.' 
        });
      }

      try {
        // Generate S3 key
        const s3Key = generateS3Key(file.originalname, userId, folderPath);
        // Get image dimensions if it's an image
        const { width, height } = await getImageDimensions(file.buffer, file.mimetype);
        // Upload to S3/OCI
        const uploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalName: file.originalname,
            uploadedBy: userId.toString(),
            uploadedAt: new Date().toISOString()
          }
        });
        
        const s3Result = await s3.send(uploadCommand);
        // For private buckets, we don't store a public URL - we'll generate signed URLs on demand
        const privateUrl = 'PRIVATE_BUCKET'; // Placeholder for private bucket - use signed URLs instead
        // Save to database
        const dbQuery = `
          INSERT INTO media (
            filename, original_name, file_type, file_size, s3_key, s3_bucket, 
            public_url, uploaded_by, folder_path, tags, alt_text, mime_type, width, height
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;
        const values = [
          path.basename(s3Key),
          file.originalname,
          path.extname(file.originalname).toLowerCase().replace('.', ''),
          file.size,
          s3Key,
          BUCKET_NAME,
          privateUrl,
          userId,
          folderPath,
          tags,
          altText,
          file.mimetype,
          width,
          height
        ];
        const result = await pool.query(dbQuery, values);
        const mediaRecord = result.rows[0];
        res.status(201).json({ success: true, message: 'File uploaded successfully', media: mediaRecord });
      } catch (uploadError) {
        console.error('S3/OCI upload error:', uploadError);
        res.status(500).json({ success: false, message: 'Failed to upload file to cloud storage' });
      }
    });
  } catch (error) {
    console.error('Upload controller error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all media files
export const getMediaFiles = async (req, res) => {
  try {
    const pool = getDbPool();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const folderPath = req.query.folder || '/';
    const fileType = req.query.type;
    const search = req.query.search;

    let query = `
      SELECT m.*, u.username, u.first_name, u.last_name
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.folder_path = $1
    `;
    let queryParams = [folderPath];
    let paramIndex = 2;

    // Add file type filter
    if (fileType) {
      query += ` AND m.file_type = $${paramIndex}`;
      queryParams.push(fileType);
      paramIndex++;
    }

    // Add search filter
    if (search) {
      query += ` AND (m.original_name ILIKE $${paramIndex} OR m.alt_text ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Generate signed URLs for private bucket access
    const mediaWithSignedUrls = await Promise.all(
      result.rows.map(async (media) => {
        try {
          if (media.s3_key && media.s3_bucket) {
            const signedUrl = await generateSignedUrl(media.s3_key, media.s3_bucket);
            return { ...media, signed_url: signedUrl };
          }
          return media;
        } catch (error) {
          console.error(`Error generating signed URL for ${media.s3_key}:`, error);
          return media; // Return without signed URL if generation fails
        }
      })
    );

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM media WHERE folder_path = $1`;
    let countParams = [folderPath];
    if (fileType) {
      countQuery += ` AND file_type = $2`;
      countParams.push(fileType);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalFiles = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      media: mediaWithSignedUrls,
      pagination: {
        page,
        limit,
        total: totalFiles,
        totalPages: Math.ceil(totalFiles / limit)
      }
    });

  } catch (error) {
    console.error('Get media files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media files'
    });
  }
};

// Get single media file
export const getMediaFile = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();
    
    const query = `
      SELECT m.*, u.username, u.first_name, u.last_name
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found'
      });
    }

    const media = result.rows[0];
    
    // Generate signed URL for private bucket access
    try {
      if (media.s3_key && media.s3_bucket) {
        const signedUrl = await generateSignedUrl(media.s3_key, media.s3_bucket);
        media.signed_url = signedUrl;
      }
    } catch (error) {
      console.error(`Error generating signed URL for ${media.s3_key}:`, error);
      // Continue without signed URL
    }

    res.json({
      success: true,
      media: media
    });

  } catch (error) {
    console.error('Get media file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media file'
    });
  }
};

// Update media file metadata
export const updateMediaFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { altText, tags, description, folderPath } = req.body;
    
    const pool = getDbPool();
    const query = `
      UPDATE media 
      SET alt_text = $1, tags = $2, description = $3, folder_path = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    const result = await pool.query(query, [altText, tagsArray, description, folderPath, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found'
      });
    }

    res.json({
      success: true,
      message: 'Media file updated successfully',
      media: result.rows[0]
    });

  } catch (error) {
    console.error('Update media file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update media file'
    });
  }
};

// Delete media file
export const deleteMediaFile = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();
    
    // Get media file info first
    const getQuery = 'SELECT * FROM media WHERE id = $1';
    const getResult = await pool.query(getQuery, [id]);
    
    if (getResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found'
      });
    }

    const mediaFile = getResult.rows[0];

    // Get storage settings from DB to initialize S3 client
    const settingsRes = await pool.query("SELECT key, value, type FROM settings WHERE key IN ('media_storage_type', 'oci_config', 'aws_config')");
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
    
    const storageType = settings.media_storage_type || 'oci';
    let s3, BUCKET_NAME;
    
    if (storageType === 'aws' && settings.aws_config && settings.aws_config.roleArn) {
      // Use IAM Role with STS for AWS
      s3 = await getS3Client(settings.aws_config);
      BUCKET_NAME = settings.aws_config.bucketName;
    } else if (storageType === 'aws' && settings.aws_config && settings.aws_config.accessKey) {
      // Fallback: Use static keys if role not set
      s3 = new S3Client({
        credentials: {
          accessKeyId: settings.aws_config.accessKey,
          secretAccessKey: settings.aws_config.secretKey,
        },
        region: settings.aws_config.region,
        endpoint: settings.aws_config.endpoint || undefined,
        forcePathStyle: true
      });
      BUCKET_NAME = settings.aws_config.bucketName;
    } else if (settings.oci_config && settings.oci_config.bucket) {
      // OCI or other provider
      s3 = new S3Client({
        credentials: {
          accessKeyId: settings.oci_config.accessKey,
          secretAccessKey: settings.oci_config.secretKey,
        },
        region: settings.oci_config.region,
        endpoint: settings.oci_config.endpoint || undefined,
        forcePathStyle: true
      });
      BUCKET_NAME = settings.oci_config.bucket;
    } else {
      console.error('No valid storage configuration found for file deletion');
      // Don't fail deletion if cloud storage isn't configured
      // Just delete from database
    }

    // Delete from S3/OCI
    if (s3 && BUCKET_NAME) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: mediaFile.s3_key
        });
        await s3.send(deleteCommand);
        console.log(`Successfully deleted file from cloud storage: ${mediaFile.s3_key}`);
      } catch (s3Error) {
        console.error('S3/OCI delete error:', s3Error);
        // Continue with database deletion even if S3 delete fails
      }
    } else {
      console.log('No cloud storage configured, skipping cloud file deletion');
    }

    // Delete from database
    const deleteQuery = 'DELETE FROM media WHERE id = $1';
    await pool.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Media file deleted successfully'
    });

  } catch (error) {
    console.error('Delete media file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete media file'
    });
  }
};

// Get media folders
export const getMediaFolders = async (req, res) => {
  try {
    const pool = getDbPool();
    const query = `
      SELECT mf.*, 
             COUNT(m.id) as file_count,
             u.username as created_by_username
      FROM media_folders mf
      LEFT JOIN media m ON m.folder_path = mf.path
      LEFT JOIN users u ON mf.created_by = u.id
      GROUP BY mf.id, u.username
      ORDER BY mf.path
    `;
    
    const result = await pool.query(query);

    res.json({
      success: true,
      folders: result.rows
    });

  } catch (error) {
    console.error('Get media folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media folders'
    });
  }
};

// Create media folder
export const createMediaFolder = async (req, res) => {
  try {
    const { name, parentPath } = req.body;
    
    // Admin authentication is handled by requireAdminAuth middleware
    const userId = req.adminUser.id;

    const sanitizedName = name.replace(/[^a-zA-Z0-9-_\s]/g, '').trim();
    const folderPath = parentPath === '/' ? `/${sanitizedName}` : `${parentPath}/${sanitizedName}`;

    const pool = getDbPool();
    const query = `
      INSERT INTO media_folders (name, path, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [sanitizedName, folderPath, userId]);

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder: result.rows[0]
    });

  } catch (error) {
    console.error('Create media folder error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        message: 'Folder already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create folder'
      });
    }
  }
};

// AWS Credential Management endpoints
export const getAWSCredentialStatus = async (req, res) => {
  try {
    const status = credentialManager.getStatus();
    res.json({
      success: true,
      status: {
        ...status,
        timeUntilExpiryHuman: status.timeUntilExpiry 
          ? `${Math.floor(status.timeUntilExpiry / 60000)} minutes`
          : 'N/A'
      }
    });
  } catch (error) {
    console.error('Error getting credential status:', error);
    res.status(500).json({ success: false, message: 'Failed to get credential status' });
  }
};

export const refreshAWSCredentials = async (req, res) => {
  try {
    console.log('🔄 Manual credential refresh requested');
    await credentialManager.forceRefresh();
    res.json({ 
      success: true, 
      message: 'AWS credentials refreshed successfully' 
    });
  } catch (error) {
    console.error('Error refreshing credentials:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to refresh credentials: ${error.message}` 
    });
  }
};

// Test AWS connection
export const testAwsConnection = async (req, res) => {
  try {
    console.log('🧪 Testing AWS S3 connection...');
    
    const { bucketName, region, roleArn, externalId, accessKey, secretKey, sessionToken } = req.body;
    
    console.log('🔍 Connection test parameters:', { 
      bucketName, 
      region, 
      hasRoleArn: !!roleArn, 
      hasExternalId: !!externalId,
      hasAccessKey: !!accessKey,
      hasSecretKey: !!secretKey,
      hasSessionToken: !!sessionToken
    });
    
    // Validate required fields
    if (!bucketName || !region) {
      return res.status(400).json({
        success: false,
        message: 'Bucket name and region are required'
      });
    }
    
    // Check authentication method
    const hasRoleAuth = roleArn && externalId;
    const hasAccessKeys = accessKey && secretKey && sessionToken;
    
    if (!hasRoleAuth && !hasAccessKeys) {
      return res.status(400).json({
        success: false,
        message: 'Either IAM role (roleArn + externalId) or access keys (accessKey + secretKey + sessionToken) are required'
      });
    }
    
    let finalCredentials;
    let authMethod;
    
    // Configure credentials based on authentication method
    if (hasAccessKeys && hasRoleAuth) {
      // We have both - use Identity Center credentials to assume the role
      console.log('🔑 Using Identity Center credentials to assume IAM role');
      try {
        const { STSClient, AssumeRoleCommand } = await import('@aws-sdk/client-sts');
        
        const stsClient = new STSClient({
          region: region,
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
            sessionToken: sessionToken
          }
        });
        
        console.log('🎭 Assuming role:', roleArn);
        
        const assumeRoleCommand = new AssumeRoleCommand({
          RoleArn: roleArn,
          RoleSessionName: 'MediaLibraryConnectionTest',
          DurationSeconds: 3600,
          ExternalId: externalId
        });
        
        const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
        
        finalCredentials = {
          accessKeyId: assumeRoleResponse.Credentials.AccessKeyId,
          secretAccessKey: assumeRoleResponse.Credentials.SecretAccessKey,
          sessionToken: assumeRoleResponse.Credentials.SessionToken
        };
        
        authMethod = 'IAM Role (via Identity Center)';
        console.log('✅ Successfully assumed role');
        
      } catch (roleError) {
        console.error('❌ Failed to assume role:', roleError);
        return res.status(403).json({
          success: false,
          message: `Failed to assume IAM role: ${roleError.message}. Check role ARN, external ID, and trust policy.`,
          error: roleError.name
        });
      }
    } else if (hasAccessKeys) {
      // Use temporary credentials directly
      finalCredentials = {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        sessionToken: sessionToken
      };
      authMethod = 'Temporary Access Keys (Direct)';
      console.log('🔑 Using temporary access keys directly');
    } else if (hasRoleAuth) {
      // Try to use cached credentials from credential manager
      try {
        finalCredentials = await credentialManager.getCredentials();
        authMethod = 'IAM Role (Cached)';
        console.log('🔑 Using cached role credentials for test');
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Role-based authentication requires valid cached credentials. Please ensure IAM role is properly configured.'
        });
      }
    }
    
    // Create S3 client
    const { S3Client, HeadBucketCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: region,
      credentials: finalCredentials,
      forcePathStyle: false
    });
    
    console.log(`🪣 Testing bucket access: ${bucketName} in region: ${region}`);
    
    // Test 1: Check if bucket exists and is accessible
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log('✅ Bucket head operation successful');
    } catch (headError) {
      console.error('❌ Bucket head operation failed:', headError);
      throw headError;
    }
    
    // Test 2: Try to list objects (limited to 1 for efficiency)
    console.log(`📂 Testing list permissions on bucket: ${bucketName}`);
    let listResult;
    try {
      listResult = await s3Client.send(new ListObjectsV2Command({ 
        Bucket: bucketName, 
        MaxKeys: 1 
      }));
      console.log('✅ List objects operation successful');
    } catch (listError) {
      console.error('❌ List objects operation failed:', listError);
      throw listError;
    }
    
    console.log('✅ AWS S3 connection test successful');
    
    res.json({
      success: true,
      message: 'AWS S3 connection successful',
      details: {
        bucketName,
        region,
        authMethod,
        bucketAccessible: true,
        listPermissions: true,
        objectCount: listResult.KeyCount || 0
      }
    });
    
  } catch (error) {
    console.error('❌ AWS S3 connection test failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    // Parse specific AWS errors with more detail
    if (error.name === 'NoSuchBucket') {
      errorMessage = `Bucket '${req.body.bucketName}' does not exist or is not accessible`;
      statusCode = 404;
    } else if (error.name === 'AccessDenied' || error.name === 'Forbidden') {
      errorMessage = 'Access denied. Check your IAM role permissions and trust policy';
      statusCode = 403;
    } else if (error.name === 'InvalidAccessKeyId') {
      errorMessage = 'Invalid access key ID';
      statusCode = 401;
    } else if (error.name === 'SignatureDoesNotMatch') {
      errorMessage = 'Invalid secret access key';
      statusCode = 401;
    } else if (error.name === 'TokenRefreshRequired') {
      errorMessage = 'Session token has expired. Please refresh credentials';
      statusCode = 401;
    } else if (error.name === 'CredentialsError') {
      errorMessage = 'Invalid or expired credentials';
      statusCode = 401;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Network error: Unable to reach AWS S3 service';
      statusCode = 503;
    } else if (error.$metadata?.httpStatusCode === 403) {
      errorMessage = 'Access denied (403). Verify IAM role permissions, trust policy, and external ID match exactly';
      statusCode = 403;
    } else {
      errorMessage = error.message || 'Connection test failed';
      if (error.$metadata?.httpStatusCode) {
        statusCode = error.$metadata.httpStatusCode;
      }
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.name || 'ConnectionError',
      details: {
        httpStatusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
        errorCode: error.Code || error.code
      }
    });
  }
};
