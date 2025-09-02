import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { getDbPool } from '../db.js';
import jwt from 'jsonwebtoken';

// Helper: Assume IAM Role and get temporary credentials
async function getS3ClientFromRole(config) {
  const stsClient = new STSClient({ region: config.region });
  const assumeRoleCommand = new AssumeRoleCommand({
    RoleArn: config.roleArn,
    RoleSessionName: 'MediaLibrarySession',
    DurationSeconds: 3600,
    ...(config.externalId ? { ExternalId: config.externalId } : {})
  });
  
  const data = await stsClient.send(assumeRoleCommand);
  
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
    },
    forcePathStyle: true
  });
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
      
      if (storageType === 'aws' && settings.aws_config && settings.aws_config.roleArn) {
        // Use IAM Role with STS for AWS
        s3 = await getS3ClientFromRole(settings.aws_config);
        BUCKET_NAME = settings.aws_config.bucketName;
        CDN_URL = settings.aws_config.cdnUrl || `https://${settings.aws_config.bucketName}.s3.${settings.aws_config.region}.amazonaws.com`;
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
        CDN_URL = settings.aws_config.cdnUrl || `https://${settings.aws_config.bucketName}.s3.${settings.aws_config.region}.amazonaws.com`;
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
        // Default to AWS with error handling
        throw new Error('No valid storage configuration found. Please configure AWS S3 or OCI Object Storage in Operations Center.');
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
          ACL: 'public-read',
          Metadata: {
            originalName: file.originalname,
            uploadedBy: userId.toString(),
            uploadedAt: new Date().toISOString()
          }
        });
        
        const s3Result = await s3.send(uploadCommand);
        const publicUrl = `${CDN_URL}/${s3Key}`;
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
          publicUrl,
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
      media: result.rows,
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

    res.json({
      success: true,
      media: result.rows[0]
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
      s3 = await getS3ClientFromRole(settings.aws_config);
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
