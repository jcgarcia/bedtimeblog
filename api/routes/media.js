import express from "express";
import { requireAdminAuth } from "../controllers/admin.js";
import {
  uploadToS3,
  getMediaFiles,
  getMediaFile,
  updateMediaFile,
  deleteMediaFile,
  moveMediaFile,
  getMediaFolders,
  createMediaFolder,
  testAwsConnection,
  testAwsConnectionSimple,
  testOidcConnection,
  syncS3Files,
  clearMediaDatabase,
  getAWSCredentialStatus,
  refreshAWSCredentials,
  updateAWSCredentials,
  initializeSSO,
  testSSOCredentials,
  startSSOSession,
  completeSSOSession,
  getSignedUrlForKey
} from "../controllers/media.js";

const router = express.Router();

// Handle OPTIONS requests for CORS preflight
router.options("*", (req, res) => {
  res.status(200).end();
});

// Media serving route - serve files by filename with signed URLs
router.get("/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`📁 Media request for filename: ${filename}`);
    
    // Look up the file in the database
    const { getDbPool } = await import("../db.js");
    const pool = getDbPool();
    const result = await pool.query(
      "SELECT s3_key, s3_bucket FROM media WHERE filename = $1",
      [filename]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ File not found in database: ${filename}`);
      return res.status(404).json({ error: "File not found" });
    }
    
    const { s3_key, s3_bucket } = result.rows[0];
    console.log(`🔍 Found file: ${s3_key} in bucket: ${s3_bucket}`);
    
    // Generate signed URL directly
    const { getS3Client } = await import("../controllers/media.js");
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    
    // Get AWS config from database
    const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'aws_config'");
    if (settingsRes.rows.length === 0) {
      console.error('❌ AWS configuration not found');
      return res.status(500).json({ error: "AWS configuration not found" });
    }
    
    const awsConfig = JSON.parse(settingsRes.rows[0].value);
    const s3Client = await getS3Client(awsConfig);
    
    const command = new GetObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: s3_key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log(`✅ Generated signed URL for: ${filename}`);
    
    // Redirect to the signed URL
    res.redirect(302, signedUrl);
    
  } catch (error) {
    console.error(`❌ Error serving media file ${req.params.filename}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Media file management routes
router.post("/upload", requireAdminAuth, uploadToS3);              // POST /api/media/upload - Upload file to S3
router.get("/files", requireAdminAuth, getMediaFiles);             // GET /api/media/files - Get all media files with pagination
router.get("/files/:id", requireAdminAuth, getMediaFile);          // GET /api/media/files/:id - Get single media file
router.put("/files/:id", requireAdminAuth, updateMediaFile);       // PUT /api/media/files/:id - Update media metadata
router.put("/files/:id/move", requireAdminAuth, moveMediaFile);    // PUT /api/media/files/:id/move - Move file to different folder
router.delete("/files/:id", requireAdminAuth, deleteMediaFile);    // DELETE /api/media/files/:id - Delete media file
router.get("/signed-url", requireAdminAuth, getSignedUrlForKey);   // GET /api/media/signed-url?key=... - Get signed URL for S3 key

// Folder management routes
router.get("/folders", requireAdminAuth, getMediaFolders);         // GET /api/media/folders - Get all folders
router.post("/folders", requireAdminAuth, createMediaFolder);      // POST /api/media/folders - Create new folder

// AWS connection testing
router.post("/test-aws-connection", requireAdminAuth, testAwsConnectionSimple); // POST /api/media/test-aws-connection - Test AWS S3 connection using credential manager
router.post("/test-oidc-connection", requireAdminAuth, testOidcConnection); // POST /api/media/test-oidc-connection - Test OIDC configuration
router.post("/sync-s3", requireAdminAuth, syncS3Files);              // POST /api/media/sync-s3 - Sync S3 bucket with database
router.post("/clear-database", requireAdminAuth, clearMediaDatabase); // POST /api/media/clear-database - Clear all media records

// AWS credential management
router.get("/credential-status", requireAdminAuth, getAWSCredentialStatus); // GET /api/media/credential-status - Get credential status
router.post("/refresh-credentials", requireAdminAuth, refreshAWSCredentials); // POST /api/media/refresh-credentials - Manually refresh credentials
router.put("/update-credentials", requireAdminAuth, updateAWSCredentials); // PUT /api/media/update-credentials - Update AWS credentials manually

// AWS SSO management
router.post("/initialize-sso", requireAdminAuth, initializeSSO); // POST /api/media/initialize-sso - Initialize SSO credentials
router.post("/test-sso", requireAdminAuth, testSSOCredentials); // POST /api/media/test-sso - Test SSO credentials
router.post("/start-sso-session", requireAdminAuth, startSSOSession); // POST /api/media/start-sso-session - Start SSO device authorization
router.post("/complete-sso-session", requireAdminAuth, completeSSOSession); // POST /api/media/complete-sso-session - Complete SSO setup

router.get("/debug-version", (req, res) => res.json({ version: "2.0", timestamp: new Date().toISOString() })); // Debug endpoint

export default router;
