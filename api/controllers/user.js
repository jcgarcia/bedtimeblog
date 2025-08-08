import { getDbPool } from "../db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../utils/auth.js";

// Get all users (admin only)
export const getUsers = async (req, res) => {
  const pool = getDbPool();
  
  // Use the auth middleware inline
  const { requireAdmin } = await import("../utils/auth.js");
  return requireAdmin(req, res, async () => {
    try {
      // Get all users except current admin
      const q = `
        SELECT id, username, email, first_name, last_name, created_at, role
        FROM users 
        WHERE role != 'admin' OR id != $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(q, [req.user.id]);
      
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('Database error in getUsers:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
};

// Create a new user (admin only)
export const createUser = async (req, res) => {
  const pool = getDbPool();
  
  // Use the auth middleware inline
  const { requireAdmin } = await import("../utils/auth.js");
  return requireAdmin(req, res, async () => {
    try {
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
  });
};

// Update a user (admin only)
export const updateUser = async (req, res) => {
  const pool = getDbPool();
  
  // Use the auth middleware inline
  const { requireAdmin } = await import("../utils/auth.js");
  return requireAdmin(req, res, async () => {
    try {
      const userIdToUpdate = req.params.id;
      const { username, email, password, first_name, last_name } = req.body;

      if (!username || !email) {
        return res.status(400).json("Username and email are required.");
      }

      // Check if user exists
      const userToUpdate = await pool.query(
        "SELECT * FROM users WHERE id = $1", 
        [userIdToUpdate]
      );
      
      if (userToUpdate.rows.length === 0) {
        return res.status(404).json("User not found.");
      }

      // Don't allow updating admin users
      if (userToUpdate.rows[0].role === 'admin' || userToUpdate.rows[0].role === 'super_admin') {
        return res.status(403).json("Cannot update admin users.");
      }

      // Check if username/email is already taken by another user
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE (email = $1 OR username = $2) AND id != $3",
        [email, username, userIdToUpdate]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json("Email or username already exists for another user.");
      }

      // Build update query dynamically
      let updateFields = [];
      let values = [];
      let valueIndex = 1;

      updateFields.push(`username = $${valueIndex++}`);
      values.push(username);

      updateFields.push(`email = $${valueIndex++}`);
      values.push(email);

      updateFields.push(`first_name = $${valueIndex++}`);
      values.push(first_name || null);

      updateFields.push(`last_name = $${valueIndex++}`);
      values.push(last_name || null);

      // Only update password if provided
      if (password && password.trim()) {
        const hashedPassword = await argon2.hash(password);
        updateFields.push(`password_hash = $${valueIndex++}`);
        values.push(hashedPassword);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const q = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING id, username, email, first_name, last_name, created_at, updated_at
      `;
      
      values.push(userIdToUpdate);

      const result = await pool.query(q, values);

      return res.status(200).json({
        message: "User updated successfully",
        user: result.rows[0]
      });
    } catch (err) {
      console.error('Database error in updateUser:', err);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  });
};

// Delete a user (admin only)
export const deleteUser = async (req, res) => {
  const pool = getDbPool();
  
  // Use the auth middleware inline
  const { requireAdmin } = await import("../utils/auth.js");
  return requireAdmin(req, res, async () => {
    try {
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
  });
};