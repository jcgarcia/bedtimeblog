import express from "express";
import { register, login, logout, verify } from "../controllers/auth.js";
import passport from "passport";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", verify);

// Route for initiating Google OAuth
router.get("/google", passport.authenticate("google", {
  scope: ["profile"]
}));

// Route for handling Google OAuth callback
router.get("/google/callback", passport.authenticate("google", {
  failureRedirect: "/login",
  session: false
}), (req, res) => {
  // Extract user data from req.user (provided by Passport)
  const { displayName, photos } = req.user;
  const user = {
    name: displayName,
    avatar: photos[0].value
  };

  // Send user data to the client (e.g., via a cookie or token)
  res.redirect(`/welcome?user=${encodeURIComponent(JSON.stringify(user))}`);
});

export default router;
