import express from "express";
import {
  getSettings,
  updateSettings,
  getSocialMediaLinks,
  updateSocialMediaLinks,
  getOAuthSettings,
  updateOAuthSettings,
  getAwsExternalId,
  saveAwsExternalId,
  getAwsConfig,
  updateAwsConfig
} from "../controllers/settings.js";
import { requireAdminAuth } from "../controllers/admin.js";

const router = express.Router();

// Get all public settings
router.get("/", getSettings);

// Update settings (admin only)
router.put("/", updateSettings);

// Get social media links
router.get("/social", getSocialMediaLinks);

// Update social media links (admin only)
router.put("/social", updateSocialMediaLinks);

// Get OAuth configuration (admin only)
router.get("/oauth", requireAdminAuth, getOAuthSettings);

// Update OAuth configuration (admin only) 
router.put("/oauth", requireAdminAuth, updateOAuthSettings);

// AWS External ID management (admin only)
router.get("/aws-external-id", requireAdminAuth, getAwsExternalId);
router.post("/aws-external-id", requireAdminAuth, saveAwsExternalId);

// AWS Configuration management (admin only)
router.get("/aws-config", requireAdminAuth, getAwsConfig);
router.put("/aws-config", requireAdminAuth, updateAwsConfig);

export default router;
