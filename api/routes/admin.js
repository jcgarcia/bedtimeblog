import express from "express";
import { adminLogin, verifyAdminToken, adminLogout, requireAdminAuth, rateLimitLogin } from "../controllers/admin.js";
import { getOAuthConfig, updateOAuthConfig, getProviderConfig } from "../controllers/oauthConfig.js";

const router = express.Router();

// Admin authentication routes
router.post("/login", rateLimitLogin, adminLogin);
router.post("/verify", verifyAdminToken);
router.post("/logout", adminLogout);

// Protected admin routes (examples)
router.get("/dashboard", requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to admin dashboard",
    user: req.adminUser
  });
});

// Get admin profile
router.get("/profile", requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    user: req.adminUser
  });
});

export default router;
