import express from "express";
import { register, login, logout } from "../controllers/auth.js";
import passport from "passport";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Route for initiating Google OAuth
router.get("/google", passport.authenticate("google", {
  scope: ["profile"]
}));

// Route for handling Google OAuth callback
router.get("/google/callback", passport.authenticate("google", {
  failureRedirect: "/login",
  session: false
}), (req, res) => {
  try {
    // Extract user data from req.user (provided by Passport)
    const { displayName, photos } = req.user;
    const user = {
      name: displayName,
      avatar: photos[0]?.value || null
    };

    // For API consistency, return JSON instead of redirect
    // Frontend can handle this response and redirect appropriately
    res.status(200).json({
      success: true,
      message: "Google authentication successful",
      user: user,
      redirectUrl: `/welcome?user=${encodeURIComponent(JSON.stringify(user))}`
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: "Authentication callback failed",
      message: error.message
    });
  }
});

export default router;
