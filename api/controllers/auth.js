import { getDbPool } from "../db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const pool = getDbPool();
  
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check existing user
    const q = "SELECT * FROM users WHERE email = $1 OR username = $2";
    const result = await pool.query(q, [email, username]);
    
    if (result.rows.length) {
      return res.status(409).json({
        success: false,
        message: 'User already exists!'
      });
    }
    
    // Hash the password and create a user
    const hash = await argon2.hash(password);
    const q2 = `INSERT INTO users(username, email, password_hash, first_name, last_name, role, is_active, email_verified) 
                VALUES ($1, $2, $3, $4, $5, 'user', true, false)
                RETURNING id, username, email, first_name, last_name, role, created_at`;
    
    const newUserResult = await pool.query(q2, [username, email, hash, firstName, lastName]);
    const newUser = newUserResult.rows[0];
    
    return res.status(200).json({
      success: true,
      message: 'User has been created.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    });
  } catch (err) {
    console.error('Database error in register:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
};

export const login = async (req, res) => {
  const pool = getDbPool();
  
  try {
    // Accept both email and username for login
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
    }
    
    // Check user by username OR email
    const q = "SELECT * FROM users WHERE username = $1 OR email = $1";
    const result = await pool.query(q, [loginIdentifier]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found!'
      });
    }
    
    // Check password
    const user = result.rows[0];
    const isPasswordCorrect = await argon2.verify(
      user.password_hash,
      password
    );
    
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Wrong username or password!'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT token with proper secret
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    
    // Return response in expected format
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: userWithoutPassword.id,
        username: userWithoutPassword.username,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.first_name,
        lastName: userWithoutPassword.last_name,
        role: userWithoutPassword.role,
        isActive: userWithoutPassword.is_active,
        emailVerified: userWithoutPassword.email_verified,
        lastLoginAt: userWithoutPassword.last_login_at,
        createdAt: userWithoutPassword.created_at
      }
    });
  } catch (err) {
    console.error('Database error in login:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("access_token",{
    sameSite:"none",
    secure:true
  }).status(200).json("User has been logged out.")
};

// Verify user token
export const verify = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get current user data
    const pool = getDbPool();
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, is_active, 
              email_verified, last_login_at, created_at
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
