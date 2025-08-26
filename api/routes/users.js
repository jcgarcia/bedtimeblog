import express from "express";
import { getDbPool } from "../db.js";
import argon2 from "argon2";
import { cognitoAuth } from "../middleware/cognitoAuth.js";
import { requireAdminAuth } from "../controllers/admin.js";

const router = express.Router();

// Get all users (admin only)
router.get("/", [requireAdminAuth, cognitoAuth("admin")], async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query(`
      SELECT id, username, email, first_name, last_name, role, is_active, 
             email_verified, last_login_at, created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Create new user (admin only)
router.post("/", [requireAdminAuth, cognitoAuth("admin")], async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'user' } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    const pool = getDbPool();

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // Hash password with Argon2
    const passwordHash = await argon2.hash(password);

    // Create user
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, true, true)
      RETURNING id, username, email, first_name, last_name, role, is_active, created_at
    `, [username, email, passwordHash, firstName, lastName, role]);

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Update user (admin only)
router.put("/:id", [requireAdminAuth, cognitoAuth("admin")], async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, role, isActive, password } = req.body;

    const pool = getDbPool();

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }

    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }

    if (role !== undefined) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (password) {
      const passwordHash = await argon2.hash(password);
      updateFields.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, first_name, last_name, role, is_active, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user (admin only)
router.delete("/:id", [requireAdminAuth, cognitoAuth("admin")], async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    // Don't allow deleting the current admin user
    if (req.adminUser.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${result.rows[0].username} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

export default router;