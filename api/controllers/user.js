import { getDbPool } from "../db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

// Get all users (admin only)
export const getUsers = async (req, res) => {
  const pool = getDbPool();
  
  try {
    // Verify admin token
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json("Access denied! Please login as admin.");
    }

    const userInfo = jwt.verify(token, "jwtkey");
    
    // Check if user is admin
    const adminCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1 AND role = 'admin'", 
      [userInfo.id]
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json("Access denied! Admin privileges required.");
    }

    // Get all users except current admin
    const q = `
      SELECT id, username, email, first_name, last_name, created_at, role
      FROM users 
      WHERE role != 'admin' OR id != $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(q, [userInfo.id]);
    
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error in getUsers:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Create a new user (admin only)
export const createUser = async (req, res) => {
  const pool = getDbPool();
  
  try {
    // Verify admin token
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json("Access denied! Please login as admin.");
    }

    const userInfo = jwt.verify(token, "jwtkey");
    
    // Check if user is admin
    const adminCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1 AND role = 'admin'", 
      [userInfo.id]
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json("Access denied! Admin privileges required.");
    }

    const { username, email, password, first_name, last_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json("Username, email, and password are required.");
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json("User with this email or username already exists.");
    }

    // Hash password
    const hashedPassword = await argon2.hash(password);

    // Create user
    const q = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, 'user')
      RETURNING id, username, email, first_name, last_name, created_at
    `;
    
    const result = await pool.query(q, [
      username, 
      email, 
      hashedPassword, 
      first_name || null, 
      last_name || null
    ]);

    return res.status(201).json({
      message: "User created successfully",
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Database error in createUser:', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

// Delete a user (admin only)
export const deleteUser = async (req, res) => {
  const pool = getDbPool();
  
  try {
    // Verify admin token
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json("Access denied! Please login as admin.");
    }

    const userInfo = jwt.verify(token, "jwtkey");
    
    // Check if user is admin
    const adminCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1 AND role = 'admin'", 
      [userInfo.id]
    );
    
    if (adminCheck.rows.length === 0) {
      return res.status(403).json("Access denied! Admin privileges required.");
    }

    const userIdToDelete = req.params.id;

    // Don't allow deleting admin users
    const userToDelete = await pool.query(
      "SELECT role FROM users WHERE id = $1", 
      [userIdToDelete]
    );
    
    if (userToDelete.rows.length === 0) {
      return res.status(404).json("User not found.");
    }

    if (userToDelete.rows[0].role === 'admin') {
      return res.status(403).json("Cannot delete admin users.");
    }

    // Delete the user
    await pool.query("DELETE FROM users WHERE id = $1", [userIdToDelete]);

    return res.status(200).json("User deleted successfully.");
  } catch (err) {
    console.error('Database error in deleteUser:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};