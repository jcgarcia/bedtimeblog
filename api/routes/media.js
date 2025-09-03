import express from "express";
import { requireAdminAuth } from "../controllers/admin.js";
import {
  uploadToS3,
  getMediaFiles,
  getMediaFile,
  updateMediaFile,
  deleteMediaFile,
  getMediaFolders,
  createMediaFolder,
  testAwsConnection,
  syncS3Files
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
router.delete("/files/:id", requireAdminAuth, deleteMediaFile);    // DELETE /api/media/files/:id - Delete media file

// Folder management routes
router.get("/folders", requireAdminAuth, getMediaFolders);         // GET /api/media/folders - Get all folders
router.post("/folders", requireAdminAuth, createMediaFolder);      // POST /api/media/folders - Create new folder

// AWS connection testing
router.post("/test-aws-connection", requireAdminAuth, testAwsConnection); // POST /api/media/test-aws-connection - Test AWS S3 connection
router.post("/sync-s3", requireAdminAuth, syncS3Files);              // POST /api/media/sync-s3 - Sync S3 bucket with database
router.get("/debug-version", (req, res) => res.json({ version: "2.0", timestamp: new Date().toISOString() })); // Debug endpoint

export default router;
