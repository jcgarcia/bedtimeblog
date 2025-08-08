import express from "express";
import {
  getSocialMediaLinks,
  updateSocialMediaLinks,
  getContactSettings,
  updateContactSettings,
  getSmtpSettings,
  updateSmtpSettings,
  testSmtpConnection,
  getOAuthSettings,
  updateOAuthSettings,
  testOAuthConfiguration
} from "../controllers/settings.js";

const router = express.Router();

// Get social media links
router.get("/social", getSocialMediaLinks);

// Update social media links (admin only)
router.put("/social", updateSocialMediaLinks);

// Get contact settings
router.get("/contact", getContactSettings);

// Update contact settings (admin only)
router.put("/contact", updateContactSettings);

// Get SMTP settings
router.get("/smtp", getSmtpSettings);

// Update SMTP settings (admin only)
router.put("/smtp", updateSmtpSettings);

// Test SMTP connection
router.post("/smtp/test", testSmtpConnection);

// Get OAuth settings
router.get("/oauth", getOAuthSettings);

// Update OAuth settings (admin only)
router.put("/oauth", updateOAuthSettings);

// Test OAuth configuration
router.post("/oauth/test/:provider", testOAuthConfiguration);

export default router;
