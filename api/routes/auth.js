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
  failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=auth_failed`,
  session: false
}), (req, res) => {
  try {
    // Extract user data from req.user (provided by Passport)
    const { displayName, photos } = req.user;
    const user = {
      name: displayName,
      avatar: photos[0]?.value || null
    };

    // Redirect to frontend with user data in query params
    const userParam = encodeURIComponent(JSON.stringify(user));
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/?user=${userParam}&login=success`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=auth_callback_failed`);
  }
});

// Route for initiating Facebook OAuth
router.get("/facebook", passport.authenticate("facebook", {
  scope: ["public_profile"]
}));

// Route for handling Facebook OAuth callback
router.get("/facebook/callback", passport.authenticate("facebook", {
  failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=auth_failed`,
  session: false
}), (req, res) => {
  try {
    const { displayName, photos } = req.user;
    const user = {
      name: displayName,
      avatar: photos[0]?.value || null
    };

    const userParam = encodeURIComponent(JSON.stringify(user));
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/?user=${userParam}&login=success`);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=auth_callback_failed`);
  }
});

// Route for initiating Twitter OAuth
router.get("/twitter", passport.authenticate("twitter"));

// Route for handling Twitter OAuth callback
router.get("/twitter/callback", passport.authenticate("twitter", {
  failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=auth_failed`,
  session: false
}), (req, res) => {
  try {
    const { displayName, photos } = req.user;
    const user = {
      name: displayName,
      avatar: photos[0]?.value || null
    };

    const userParam = encodeURIComponent(JSON.stringify(user));
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/?user=${userParam}&login=success`);
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=auth_callback_failed`);
  }
});

export default router;
