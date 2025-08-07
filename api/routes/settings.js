import express from "express";
import {
  getSettings,
  updateSettings,
  getSocialMediaLinks,
  updateSocialMediaLinks,
  getContactSettings,
  updateContactSettings
} from "../controllers/settings.js";

const router = express.Router();

// Get all public settings
router.get("/", getSettings);

// Update settings (admin only)
router.put("/", updateSettings);

// Get social media links
router.get("/social", getSocialMediaLinks);

// Update social media links (admin only)
router.put("/social", updateSocialMediaLinks);

// Get contact settings
router.get("/contact", getContactSettings);

// Update contact settings (admin only)
router.put("/contact", updateContactSettings);

export default router;
