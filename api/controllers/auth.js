import { getDbPool } from "../db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const pool = getDbPool();
  
  try {
    // Check existing user
    const q = "SELECT * FROM users WHERE email = $1 OR username = $2";
    const result = await pool.query(q, [req.body.email, req.body.username]);
    
    if (result.rows.length) {
      return res.status(409).json("User already exists!");
    }
    
    // Hash the password with Argon2 and create a user
    const hash = await argon2.hash(req.body.password);
    const q2 = "INSERT INTO users(username,email,password_hash) VALUES ($1,$2,$3)";
    await pool.query(q2, [req.body.username, req.body.email, hash]);
    
    return res.status(200).json("User has been created.");
  } catch (err) {
    console.error('Database error in register:', err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req, res) => {
  const pool = getDbPool();
  
  try {
    const q = "SELECT * FROM users WHERE username = $1";
    const result = await pool.query(q, [req.body.username]);
    
    if (result.rows.length === 0) {
      return res.status(404).json("User not found!");
    }
    
    // Check password with Argon2
    const user = result.rows[0];
    const isPasswordCorrect = await argon2.verify(
      user.password_hash,
      req.body.password
    );
    
    if (!isPasswordCorrect) {
      return res.status(400).json("Wrong username or password!");
    }
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key');
    const { password_hash, ...other } = user;
    
    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json(other);
  } catch (err) {
    console.error('Database error in login:', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
};

export const logout = (req, res) => {
  res.clearCookie("access_token",{
    sameSite:"none",
    secure:true
  }).status(200).json("User has been logged out.")
};
