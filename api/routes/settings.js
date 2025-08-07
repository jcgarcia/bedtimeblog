import express from "express";
import {
  getSocialMediaLinks,
  updateSocialMediaLinks,
  getContactSettings,
  updateContactSettings,
  getSmtpSettings,
  updateSmtpSettings,
  testSmtpConnection
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

export default router;
