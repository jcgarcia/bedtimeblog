import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { getDbPool } from '../db.js';
import jwt from 'jsonwebtoken';
import credentialManager from '../services/awsCredentialManager.js';
import sharp from 'sharp';
import { generatePdfThumbnail, deletePdfThumbnail, getThumbnailRelativePath } from '../utils/pdfThumbnails.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// Helper: Get S3 Client with automatic credential management
export async function getS3Client(config) {
  try {
    console.log('🔑 Getting S3 client with automatic credential management');
    
    // Use the credential manager's S3 client (with automatic refresh)
    return await credentialManager.getS3Client();
    
  } catch (error) {
    console.error('❌ Failed to get S3 client:', error.message);
    
    // Provide more specific error messages
    if (error.message.includes('Identity Center credentials expired')) {
      throw new Error('Identity Center credentials have expired (12-hour limit). Please refresh credentials in Operations Panel > Media Management > Refresh Credentials button.');
    } else if (error.message.includes('No AWS configuration found')) {
      throw new Error('AWS configuration not found. Please configure AWS S3 settings in Operations Panel.');
    } else if (error.message.includes('credentials expired')) {
      throw new Error('AWS credentials have expired. Please refresh them in the Operations Panel.');
    }
    
    throw new Error(`S3 client configuration failed: ${error.message}`);
  }
}

// Helper: Generate signed URL for private S3 objects
async function generateSignedUrl(s3Key, bucketName, expiresIn = 3600) {
  try {
    // Use the credential manager's S3 client
    const s3Client = await credentialManager.getS3Client();
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('❌ Failed to generate signed URL:', error.message);
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
      const error = new Error(`Invalid file type '${file.mimetype}'. Only images, PDFs, and videos are allowed.`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
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

// Generate thumbnail for images
const generateThumbnail = async (buffer, mimetype) => {
  if (!mimetype.startsWith('image/')) {
    return null;
  }
  
  try {
    const thumbnail = await sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return thumbnail;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
};

// Get file dimensions for images
const getImageDimensions = async (buffer, mimetype) => {
  if (!mimetype.startsWith('image/')) {
    return { width: null, height: null };
  }
  
  try {
    const metadata = await sharp(buffer).metadata();
    return { 
      width: metadata.width || null, 
      height: metadata.height || null 
    };
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
        console.error('❌ Multer upload error:', {
          message: err.message,
          code: err.code,
          field: err.field,
          stack: err.stack
        });
        return res.status(400).json({ 
          success: false, 
          message: `File upload error: ${err.message}`,
          errorType: 'multer'
        });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }

      const file = req.file;
      const altText = req.body.altText || '';
      const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];

      // Auto-categorize folder path based on file type
      let folderPath = req.body.folderPath || '/';
      if (!req.body.folderPath) {
        // Auto-categorize if no folder specified  
        if (file.mimetype.startsWith('image/')) {
          folderPath = '/images';
        } else if (file.mimetype.startsWith('video/')) {
          folderPath = '/videos';
        } else if (file.mimetype === 'application/pdf') {
          folderPath = '/documents';
        } else {
          folderPath = '/documents'; // Default for other file types
        }
      }

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
        
        // Generate thumbnail for images
        let thumbnailS3Key = null;
        if (file.mimetype.startsWith('image/')) {
          const thumbnail = await generateThumbnail(file.buffer, file.mimetype);
          if (thumbnail) {
            thumbnailS3Key = s3Key.replace(/(\.[^.]+)$/, '_thumb.jpg');
            
            // Upload thumbnail to S3
            const thumbnailUploadCommand = new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: thumbnailS3Key,
              Body: thumbnail,
              ContentType: 'image/jpeg',
              Metadata: {
                originalName: file.originalname + '_thumbnail',
                uploadedBy: userId.toString(),
                uploadedAt: new Date().toISOString(),
                thumbnailFor: s3Key
              }
            });
            
            await s3.send(thumbnailUploadCommand);
            console.log(`✅ Thumbnail uploaded: ${thumbnailS3Key}`);
          }
        }
        
        // Generate thumbnail for PDFs
        let pdfThumbnailS3Key = null;
        let pdfThumbnailPath = null;
        if (file.mimetype === 'application/pdf') {
          try {
            // Create temporary file for PDF processing
            const tempDir = path.join(process.cwd(), 'temp');
            await fs.mkdir(tempDir, { recursive: true });
            
            const tempPdfPath = path.join(tempDir, `temp-${Date.now()}-${file.originalname}`);
            await fs.writeFile(tempPdfPath, file.buffer);
            
            const thumbnailDir = path.join(tempDir, 'thumbnails');
            const filenameWithoutExt = path.parse(file.originalname).name;
            
            const thumbnailResult = await generatePdfThumbnail(tempPdfPath, thumbnailDir, filenameWithoutExt);
            
            if (thumbnailResult.success) {
              // Read the generated thumbnail
              const thumbnailBuffer = await fs.readFile(thumbnailResult.thumbnailPath);
              
              // Generate S3 key for thumbnail
              pdfThumbnailS3Key = s3Key.replace(/(\.[^.]+)$/, '_thumb.png');
              
              // Upload thumbnail to S3
              const pdfThumbnailUploadCommand = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: pdfThumbnailS3Key,
                Body: thumbnailBuffer,
                ContentType: 'image/png',
                Metadata: {
                  originalName: file.originalname + '_pdf_thumbnail',
                  uploadedBy: userId.toString(),
                  uploadedAt: new Date().toISOString(),
                  thumbnailFor: s3Key,
                  generatedFrom: 'pdf'
                }
              });
              
              await s3.send(pdfThumbnailUploadCommand);
              console.log(`✅ PDF thumbnail uploaded: ${pdfThumbnailS3Key}`);
              
              // Store the relative path for database
              pdfThumbnailPath = getThumbnailRelativePath(s3Key, filenameWithoutExt);
            } else {
              console.warn(`⚠️ PDF thumbnail generation failed: ${thumbnailResult.error}`);
            }
            
            // Clean up temporary files
            try {
              await fs.unlink(tempPdfPath);
              if (thumbnailResult.success && existsSync(thumbnailResult.thumbnailPath)) {
                await fs.unlink(thumbnailResult.thumbnailPath);
              }
            } catch (cleanupError) {
              console.warn('⚠️ Cleanup warning:', cleanupError.message);
            }
            
          } catch (pdfError) {
            console.error('❌ PDF thumbnail generation error:', pdfError.message);
            // Continue with upload even if thumbnail generation fails
          }
        }
        
        // Use the appropriate thumbnail key (image or PDF)
        const finalThumbnailS3Key = thumbnailS3Key || pdfThumbnailS3Key;
        
        // Upload main file to S3/OCI
        const uploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalName: file.originalname,
            uploadedBy: userId.toString(),
            uploadedAt: new Date().toISOString(),
            ...(finalThumbnailS3Key ? { thumbnailKey: finalThumbnailS3Key } : {})
          }
        });
        
        const s3Result = await s3.send(uploadCommand);
        // For private buckets, we don't store a public URL - we'll generate signed URLs on demand
        const privateUrl = 'PRIVATE_BUCKET'; // Placeholder for private bucket - use signed URLs instead
        
        // Save to database - handle thumbnail_key column gracefully  
        let result;
        
        try {
          // Insert into database with correct thumbnail columns
          const dbQuery = `
            INSERT INTO media (
              filename, original_name, file_type, file_size, s3_key, s3_bucket, 
              public_url, uploaded_by, folder_path, tags, alt_text, mime_type, width, height, 
              thumbnail_path, thumbnail_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
            height,
            finalThumbnailS3Key,
            finalThumbnailS3Key ? 'PRIVATE_BUCKET' : null
          ];
          
          result = await pool.query(dbQuery, values);
          
        } catch (dbError) {
          // Re-throw database errors
          throw dbError;
        }
        
        const mediaRecord = result.rows[0];
        res.status(201).json({ success: true, message: 'File uploaded successfully', media: mediaRecord });
      } catch (uploadError) {
        console.error('❌ S3/OCI upload error details:', {
          error: uploadError.message,
          code: uploadError.code,
          name: uploadError.name,
          statusCode: uploadError.$metadata?.httpStatusCode,
          requestId: uploadError.$metadata?.requestId,
          stack: uploadError.stack
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed to upload file to cloud storage';
        if (uploadError.name === 'CredentialsProviderError') {
          errorMessage = 'AWS credentials are invalid or expired. Please refresh credentials in Operations Center.';
        } else if (uploadError.name === 'AccessDenied') {
          errorMessage = 'Access denied to S3 bucket. Check IAM permissions.';
        } else if (uploadError.name === 'NoSuchBucket') {
          errorMessage = 'S3 bucket not found. Check bucket configuration.';
        } else if (uploadError.code === 'InvalidClientTokenId') {
          errorMessage = 'AWS credentials are invalid. Please refresh credentials in Operations Center.';
        }
        
        res.status(500).json({ 
          success: false, 
          message: errorMessage,
          debug: process.env.NODE_ENV === 'development' ? uploadError.message : undefined,
          errorType: 's3_upload'
        });
      }
    });
  } catch (error) {
    console.error('❌ Upload controller outer error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: `Upload controller error: ${error.message}`,
      errorType: 'controller'
    });
  }
};

// Helper function to sync S3 bucket with database  
async function syncS3WithDatabase(pool, s3Client, bucketName, defaultUserId = 1) {
  try {
    console.log('🔄 Starting S3 database sync...');
    
    // Get all objects from S3 bucket (only current versions, no versioned objects)
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/', // Only sync files in uploads folder
      MaxKeys: 1000 // Ensure we get all files
    });
    
    const s3Response = await s3Client.send(listCommand);
    const s3Objects = s3Response.Contents || [];
    
    console.log(`📂 Found ${s3Objects.length} objects in S3 bucket`);
    
    // If S3 bucket is empty, return early
    if (s3Objects.length === 0) {
      console.log('📂 S3 bucket is empty, nothing to sync');
      return { syncedCount: 0, updatedCount: 0, totalProcessed: 0 };
    }
    
    // Get existing database records
    const dbResult = await pool.query('SELECT s3_key, mime_type, id FROM media');
    const existingS3Keys = new Set(dbResult.rows.map(row => row.s3_key));
    
    let syncedCount = 0;
    let updatedCount = 0;
    
    // First, update existing records to organize them properly
    for (const existingRecord of dbResult.rows) {
      if (existingRecord.mime_type) {
        let correctFolderPath = '/';
        if (existingRecord.mime_type.startsWith('image/')) {
          correctFolderPath = '/images';
        } else if (existingRecord.mime_type.startsWith('video/')) {
          correctFolderPath = '/videos';
        } else if (existingRecord.mime_type === 'application/pdf') {
          correctFolderPath = '/documents';
        } else {
          correctFolderPath = '/documents';
        }
        
        // Update folder path if needed
        const updateQuery = `
          UPDATE media 
          SET folder_path = $1 
          WHERE id = $2 AND folder_path != $1
        `;
        const updateResult = await pool.query(updateQuery, [correctFolderPath, existingRecord.id]);
        if (updateResult.rowCount > 0) {
          updatedCount++;
          console.log(`📁 Updated folder for existing file: ${existingRecord.s3_key} -> ${correctFolderPath}`);
        }
      }
    }
    
    // Add missing S3 objects to database
    for (const s3Object of s3Objects) {
      if (!existingS3Keys.has(s3Object.Key)) {
        try {
          // Parse filename and metadata from S3 key
          const filename = path.basename(s3Object.Key);
          const fileExtension = path.extname(filename);
          const fileType = fileExtension.toLowerCase().replace('.', '');
          
          // Determine mime type based on extension
          const mimeTypes = {
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 
            'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf',
            'mp4': 'video/mp4', 'mov': 'video/quicktime'
          };
          const mimeType = mimeTypes[fileType] || 'application/octet-stream';
          
          // Determine file category and folder path based on mime type
          let folderPath = '/';
          if (mimeType.startsWith('image/')) {
            folderPath = '/images';
          } else if (mimeType.startsWith('video/')) {
            folderPath = '/videos';
          } else if (mimeType === 'application/pdf') {
            folderPath = '/documents';
          } else {
            folderPath = '/documents'; // Default for other file types
          }
          
          // Insert into database
          const insertQuery = `
            INSERT INTO media (
              filename, original_name, file_type, file_size, s3_key, s3_bucket,
              public_url, uploaded_by, folder_path, mime_type, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (s3_key) DO NOTHING
            RETURNING id
          `;
          
          const insertResult = await pool.query(insertQuery, [
            filename,
            filename, // Use filename as original name since we don't have metadata
            fileType,
            s3Object.Size,
            s3Object.Key,
            bucketName,
            'PRIVATE_BUCKET', // Placeholder for private bucket
            defaultUserId,
            folderPath,
            mimeType,
            s3Object.LastModified
          ]);
          
          if (insertResult.rows.length > 0) {
            syncedCount++;
            console.log(`✅ Synced: ${s3Object.Key}`);
          }
          
        } catch (syncError) {
          console.error(`❌ Failed to sync ${s3Object.Key}:`, syncError.message);
        }
      }
    }
    
    console.log(`🎉 S3 sync completed: ${syncedCount} new files added, ${updatedCount} existing files reorganized`);
    return { syncedCount, updatedCount, totalProcessed: syncedCount + updatedCount };
    
  } catch (error) {
    console.error('❌ S3 sync failed:', error);
    throw error;
  }
}

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
    const enableSync = req.query.sync === 'true'; // Optional sync parameter

    // Check if S3 sync is enabled and get AWS config
    let syncPerformed = false;
    if (enableSync) {
      try {
        console.log('🔄 S3 sync requested, checking AWS configuration...');
        
        const settingsRes = await pool.query("SELECT key, value FROM settings WHERE key IN ('media_storage_type', 'aws_config')");
        const settings = {};
        settingsRes.rows.forEach(row => {
          try {
            settings[row.key] = row.key === 'aws_config' ? JSON.parse(row.value) : row.value;
          } catch (e) {
            console.error(`Error parsing setting ${row.key}:`, e);
          }
        });
        
        if (settings.media_storage_type === 'aws' && settings.aws_config) {
          const s3Client = await getS3Client(settings.aws_config);
          const syncResult = await syncS3WithDatabase(pool, s3Client, settings.aws_config.bucketName);
          syncPerformed = true;
          console.log(`✅ S3 sync completed: ${syncResult.syncedCount} new files, ${syncResult.updatedCount} reorganized`);
        }
      } catch (syncError) {
        console.error('⚠️ S3 sync failed, continuing with database query:', syncError.message);
      }
    }

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
            
            // Generate thumbnail URL if thumbnail exists
            let thumbnailUrl = null;
            if (media.thumbnail_path) {
              try {
                thumbnailUrl = await generateSignedUrl(media.thumbnail_path, media.s3_bucket);
              } catch (thumbError) {
                console.warn(`Could not generate thumbnail URL for ${media.thumbnail_path}:`, thumbError.message);
              }
            }
            
            return { 
              ...media, 
              public_url: signedUrl, // Use signed URL as public_url for compatibility
              signed_url: signedUrl,
              thumbnail_url: thumbnailUrl
            };
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
      syncPerformed,
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

    // Delete from S3/OCI if key exists
    if (mediaFile.s3_key) {
      try {
        const s3Client = await getS3Client(settings);
        
        // Get bucket name from settings
        const bucketName = settings.oci_config?.bucket_name || settings.aws_config?.bucket_name;
        if (!bucketName) {
          console.warn('No bucket name found in settings, skipping S3 deletion');
        } else {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: mediaFile.s3_key
          });
          
          await s3Client.send(deleteCommand);
          console.log(`✅ Deleted file from S3: ${mediaFile.s3_key}`);
          
          // Also delete thumbnail if it exists
          if (mediaFile.thumbnail_path) {
            try {
              const thumbnailDeleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: mediaFile.thumbnail_path
              });
              await s3Client.send(thumbnailDeleteCommand);
              console.log(`✅ Deleted thumbnail from S3: ${mediaFile.thumbnail_path}`);
            } catch (thumbnailError) {
              console.error('❌ Error deleting thumbnail from S3:', thumbnailError);
              // Continue even if thumbnail deletion fails
            }
          }
        }
      } catch (s3Error) {
        console.error('❌ Error deleting from S3:', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete from database
    const deleteQuery = 'DELETE FROM media WHERE id = $1 RETURNING *';
    const deleteResult = await pool.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Media file deleted successfully',
      deletedFile: deleteResult.rows[0]
    });

  } catch (error) {
    console.error('Delete media file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete media file'
    });
  }
};

// Move media file to different folder
export const moveMediaFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetFolder } = req.body;
    
    const pool = getDbPool();
    
    // First, check if the file exists
    const fileCheck = await pool.query('SELECT * FROM media WHERE id = $1', [id]);
    if (fileCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found'
      });
    }
    
    const file = fileCheck.rows[0];
    const oldPath = file.folder_path || 'root';
    
    // Update the folder_path in database
    const query = `
      UPDATE media 
      SET folder_path = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    // Empty string or null means root folder
    const folderPath = targetFolder === 'root' || targetFolder === '' ? null : targetFolder;
    const result = await pool.query(query, [folderPath, id]);
    
    console.log(`📁 Moved file "${file.filename}" from "${oldPath}" to "${targetFolder || 'root'}"`);
    
    res.json({
      success: true,
      message: `File moved successfully from ${oldPath} to ${targetFolder || 'root'}`,
      media: result.rows[0]
    });

  } catch (error) {
    console.error('Move media file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move media file'
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
    const status = await credentialManager.getStatus();
    
    // Test credentials to ensure they're working
    let credentialTest = null;
    try {
      credentialTest = await credentialManager.testCredentials();
    } catch (testError) {
      credentialTest = { success: false, error: testError.message };
    }
    
    // Add helpful status indicators
    const enhancedStatus = {
      ...status,
      test: credentialTest,
      statusLevel: getSDKStatusLevel(status, credentialTest),
      statusMessage: getSDKStatusMessage(status, credentialTest),
      actionRequired: getSDKActionRequired(status, credentialTest),
      recommendations: getSDKRecommendations(status, credentialTest),
      refreshInfo: {
        automatic: true,
        managedBy: 'AWS SDK',
        refreshStrategy: status.authMethod || 'Unknown'
      }
    };
    
    res.json({
      success: true,
      status: enhancedStatus
    });
  } catch (error) {
    console.error('Error getting credential status:', error);
    res.status(500).json({ success: false, message: 'Failed to get credential status' });
  }
};

export const refreshAWSCredentials = async (req, res) => {
  try {
    console.log('🔄 Manual credential refresh requested');
    await credentialManager.reinitialize();
    
    // Test the refreshed credentials
    const testResult = await credentialManager.testCredentials();
    
    res.json({ 
      success: true, 
      message: 'AWS credential provider reinitialized successfully',
      test: testResult
    });
  } catch (error) {
    console.error('Error refreshing credentials:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to refresh credentials: ${error.message}` 
    });
  }
};

// Update AWS credentials manually
export const updateAWSCredentials = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, sessionToken, region } = req.body;
    
    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required credentials: accessKeyId, secretAccessKey'
      });
    }
    
    // Get current config and update with new credentials
    const currentConfig = await credentialManager.getStoredAWSConfig() || {};
    
    const newConfig = {
      ...currentConfig,
      accessKey: accessKeyId,
      secretKey: secretAccessKey,
      ...(sessionToken && { sessionToken }),
      region: region || currentConfig.region || 'eu-west-2',
      credentialUpdated: new Date().toISOString()
    };
    
    // Update configuration in database and reinitialize
    await credentialManager.updateConfiguration(newConfig);
    
    // Test the new credentials
    const testResult = await credentialManager.testCredentials();
    
    res.json({
      success: true,
      message: 'AWS credentials updated and reinitialized successfully',
      test: testResult,
      config: {
        accessKey: accessKeyId.substring(0, 8) + '...',
        hasSessionToken: !!sessionToken,
        region: newConfig.region,
        updatedAt: newConfig.credentialUpdated
      }
    });
    
  } catch (error) {
    console.error('Error updating AWS credentials:', error);
    res.status(500).json({
      success: false,
      message: `Failed to update credentials: ${error.message}`
    });
  }
};

// SSO Management endpoints
export const initializeSSO = async (req, res) => {
  try {
    const { accountId, roleName } = req.body;
    
    if (!accountId || !roleName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required SSO configuration: accountId, roleName'
      });
    }
    
    const result = await credentialManager.initializeSSO(accountId, roleName);
    
    res.json({
      success: true,
      message: 'SSO credential provider initialized successfully',
      instructions: 'Please run "aws sso login" in your terminal to authenticate, then credentials will refresh automatically',
      ...result
    });
    
  } catch (error) {
    console.error('Error initializing SSO:', error);
    res.status(500).json({
      success: false,
      message: `Failed to initialize SSO: ${error.message}`
    });
  }
};

export const testSSOCredentials = async (req, res) => {
  try {
    // Try to get credentials from SSO
    const credentials = await credentialManager.getCredentialsFromSSO();
    
    res.json({
      success: true,
      message: 'SSO credentials obtained successfully',
      hasCredentials: !!credentials,
      expiryInfo: credentialManager.credentialExpiry 
        ? new Date(credentialManager.credentialExpiry).toISOString()
        : 'Unknown'
    });
    
  } catch (error) {
    console.error('Error testing SSO credentials:', error);
    res.status(500).json({
      success: false,
      message: `SSO credentials test failed: ${error.message}`,
      instructions: error.message.includes('SSO session') 
        ? 'Please run "aws sso login" in your terminal to authenticate'
        : 'Check your SSO configuration'
    });
  }
};

// Manual S3 sync endpoint
export const syncS3Files = async (req, res) => {
  try {
    console.log('🔄 Manual S3 sync requested');
    
    const pool = getDbPool();
    
    // Get AWS configuration
    const settingsRes = await pool.query("SELECT key, value FROM settings WHERE key IN ('media_storage_type', 'aws_config')");
    const settings = {};
    settingsRes.rows.forEach(row => {
      try {
        settings[row.key] = row.key === 'aws_config' ? JSON.parse(row.value) : row.value;
      } catch (e) {
        console.error(`Error parsing setting ${row.key}:`, e);
        return res.status(500).json({
          success: false,
          message: `Configuration error: ${e.message}`
        });
      }
    });
    
    if (settings.media_storage_type !== 'aws' || !settings.aws_config) {
      return res.status(400).json({
        success: false,
        message: 'AWS S3 is not configured as the storage provider'
      });
    }
    
    if (!settings.aws_config.bucketName) {
      return res.status(400).json({
        success: false,
        message: 'AWS S3 bucket name is not configured'
      });
    }
    
    // Get S3 client and perform sync
    const s3Client = await getS3Client(settings.aws_config);
    const syncResult = await syncS3WithDatabase(pool, s3Client, settings.aws_config.bucketName);
    
    res.json({
      success: true,
      message: `Successfully synced ${syncResult.syncedCount} new files and reorganized ${syncResult.updatedCount} existing files`,
      syncedCount: syncResult.syncedCount,
      updatedCount: syncResult.updatedCount,
      totalProcessed: syncResult.totalProcessed,
      bucketName: settings.aws_config.bucketName
    });
    
  } catch (error) {
    console.error('❌ Manual S3 sync failed:', error);
    res.status(500).json({
      success: false,
      message: `S3 sync failed: ${error.message}`
    });
  }
};

// Clear media database endpoint (for fresh start)
export const clearMediaDatabase = async (req, res) => {
  try {
    console.log('🗑️ Clear media database requested');
    
    const pool = getDbPool();
    
    // Get count before clearing
    const countResult = await pool.query('SELECT COUNT(*) FROM media');
    const totalRecords = parseInt(countResult.rows[0].count);
    
    // Clear all media records
    await pool.query('DELETE FROM media');
    
    console.log(`🗑️ Cleared ${totalRecords} media records from database`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${totalRecords} media records from database`,
      clearedRecords: totalRecords
    });
    
  } catch (error) {
    console.error('❌ Clear media database failed:', error);
    res.status(500).json({
      success: false,
      message: `Failed to clear media database: ${error.message}`
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

// Helper functions for enhanced credential status
function getStatusLevel(status) {
  if (!status.hasCachedCredentials) return 'CRITICAL';
  if (status.isExpired) return 'CRITICAL';
  if (status.timeUntilExpiry && status.timeUntilExpiry <= (30 * 60 * 1000)) return 'EMERGENCY';
  if (status.timeUntilExpiry && status.timeUntilExpiry <= (2 * 60 * 60 * 1000)) return 'WARNING';
  if (status.retryAttempts > 0) return 'WARNING';
  return 'HEALTHY';
}

function getStatusMessage(status) {
  const level = getStatusLevel(status);
  switch (level) {
    case 'CRITICAL':
      return status.hasCachedCredentials ? 'Credentials have expired' : 'No credentials available';
    case 'EMERGENCY':
      return `Credentials expire in ${status.timeUntilExpiryMinutes} minutes`;
    case 'WARNING':
      return status.retryAttempts > 0 
        ? `${status.retryAttempts} failed refresh attempts` 
        : `Credentials expire in ${Math.floor(status.timeUntilExpiry / (60 * 60 * 1000))} hours`;
    case 'HEALTHY':
      return `Credentials valid for ${Math.floor(status.timeUntilExpiry / (60 * 60 * 1000))} hours`;
    default:
      return 'Status unknown';
  }
}

function getActionRequired(status) {
  const level = getStatusLevel(status);
  switch (level) {
    case 'CRITICAL':
    case 'EMERGENCY':
      return 'IMMEDIATE_REFRESH_REQUIRED';
    case 'WARNING':
      return 'MONITOR_CLOSELY';
    case 'HEALTHY':
      return 'NONE';
    default:
      return 'CHECK_CONFIGURATION';
  }
}

function getRecommendations(status) {
  const recommendations = [];
  
  if (!status.hasCachedCredentials) {
    recommendations.push('Configure AWS credentials in Operations Panel');
  }
  
  if (status.isExpired || (status.timeUntilExpiry && status.timeUntilExpiry <= (30 * 60 * 1000))) {
    recommendations.push('Click "Refresh Credentials" button immediately');
  }
  
  if (status.retryAttempts >= status.maxRetryAttempts / 2) {
    recommendations.push('Check AWS SSO session with: aws sso login');
  }
  
  if (!status.sso.configured) {
    recommendations.push('Consider configuring AWS SSO for better automation');
  }
  
  if (!status.backgroundMonitoring) {
    recommendations.push('Restart application to enable background monitoring');
  }
  
  return recommendations;
}

// Helper functions for SDK-based credential status
function getSDKStatusLevel(status, testResult) {
  if (!status.configured) return 'CRITICAL';
  if (!status.initialized) return 'WARNING';
  if (testResult && !testResult.success) return 'CRITICAL';
  if (status.credentialsValid === false) return 'CRITICAL';
  if (status.isNearExpiry) return 'WARNING';
  return 'HEALTHY';
}

function getSDKStatusMessage(status, testResult) {
  const level = getSDKStatusLevel(status, testResult);
  
  switch (level) {
    case 'CRITICAL':
      if (!status.configured) return 'AWS configuration not found';
      if (!status.initialized) return 'Credential provider not initialized';
      if (testResult && !testResult.success) return `Credential test failed: ${testResult.error}`;
      if (status.credentialsValid === false) return 'Credentials are invalid';
      return 'Critical credential issue';
      
    case 'WARNING':
      if (!status.initialized) return 'Credential provider initializing';
      if (status.isNearExpiry) {
        return status.timeUntilExpiryMinutes 
          ? `Credentials expire in ${status.timeUntilExpiryMinutes} minutes`
          : 'Credentials expiring soon';
      }
      return 'Credentials need attention';
      
    case 'HEALTHY':
      if (status.timeUntilExpiryMinutes) {
        const hours = Math.floor(status.timeUntilExpiryMinutes / 60);
        const minutes = status.timeUntilExpiryMinutes % 60;
        return `Credentials valid for ${hours}h ${minutes}m (AWS SDK auto-refresh enabled)`;
      }
      return 'Credentials healthy (AWS SDK auto-refresh enabled)';
      
    default:
      return 'Status unknown';
  }
}

function getSDKActionRequired(status, testResult) {
  const level = getSDKStatusLevel(status, testResult);
  
  switch (level) {
    case 'CRITICAL':
      if (!status.configured) return 'CONFIGURE_AWS';
      if (testResult && !testResult.success) return 'REFRESH_CREDENTIALS';
      return 'IMMEDIATE_ACTION_REQUIRED';
      
    case 'WARNING':
      return 'MONITOR';
      
    case 'HEALTHY':
      return 'NONE';
      
    default:
      return 'CHECK_STATUS';
  }
}

function getSDKRecommendations(status, testResult) {
  const recommendations = [];
  const level = getSDKStatusLevel(status, testResult);
  
  if (!status.configured) {
    recommendations.push('Configure AWS settings in Operations Panel > Media Management');
    recommendations.push('Add Access Key, Secret Key, and Session Token from AWS Identity Center');
  }
  
  if (!status.initialized) {
    recommendations.push('Credential provider will initialize automatically on next use');
  }
  
  if (testResult && !testResult.success) {
    if (testResult.error.includes('expired')) {
      recommendations.push('AWS credentials have expired - refresh them in AWS Identity Center portal');
      recommendations.push('Copy new credentials to Operations Panel > Media Management');
    } else if (testResult.error.includes('Invalid')) {
      recommendations.push('AWS credentials are invalid - check Access Key and Secret Key');
    } else {
      recommendations.push('Check AWS configuration and network connectivity');
    }
  }
  
  if (status.isNearExpiry) {
    recommendations.push('AWS SDK will automatically refresh credentials soon');
    recommendations.push('No manual action required unless refresh fails');
  }
  
  if (level === 'HEALTHY') {
    recommendations.push('✅ System working correctly with automatic credential refresh');
    recommendations.push('AWS SDK will handle credential renewal automatically');
  }
  
  return recommendations;
}
