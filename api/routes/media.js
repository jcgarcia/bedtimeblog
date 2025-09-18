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
router.post("/test-aws-connection", requireAdminAuth, testAwsConnection); // POST /api/media/test-aws-connection - Test AWS S3 connection
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
