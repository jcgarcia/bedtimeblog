import { getDbPool } from "../db.js";
import jwt from "jsonwebtoken";

// Helper function to get or create default category
export const getDefaultCategoryId = async () => {
  const pool = getDbPool();
  try {
    // First, try to find existing default category with ID 0
    let result = await pool.query(
      "SELECT id FROM categories WHERE id = 0 AND is_active = true LIMIT 1"
    );
    
    if (result.rows.length > 0) {
      return 0;
    }
    
    // If no default category exists, create one with ID 0
    console.log('Creating default "Jumble" category with ID 0...');
    const insertResult = await pool.query(`
      INSERT INTO categories (id, name, slug, description, color, sort_order, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, [
      0,
      'Jumble',
      'jumble', 
      'Default category for uncategorized posts',
      '#6B7280', // Gray color
      0 // Highest priority sort order
    ]);
    
    console.log('Default category "Jumble" ensured with ID:', insertResult.rows[0].id);
    return 0;
    
  } catch (error) {
    console.error('Error getting/creating default category:', error);
    // If we can't create default category, return null and let the post be saved without category
    return null;
  }
};

export const getCategories = async (req, res) => {
  const pool = getDbPool();
  try {
    const q = `
      SELECT id, name, slug, description, color, sort_order
      FROM categories 
      WHERE is_active = true 
      ORDER BY sort_order ASC, name ASC
    `;
    const result = await pool.query(q);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error in getCategories:', err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const addCategory = async (req, res) => {
  const pool = getDbPool();
  
  // Check authentication
  const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }
  
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Only allow admin/super_admin to create categories
    if (userInfo.role !== 'admin' && userInfo.role !== 'super_admin') {
      return res.status(403).json("You don't have permission to create categories!");
    }
    
    const { name, description, color } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json("Category name is required!");
    }
    
    // Generate slug from name
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
    
    // Check if slug exists and make it unique
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existingCategory = await pool.query('SELECT id FROM categories WHERE slug = $1', [finalSlug]);
      if (existingCategory.rows.length === 0) {
        break;
      }
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    
    // Get the next sort order
    const sortOrderResult = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM categories');
    const sortOrder = sortOrderResult.rows[0].next_order;
    
    const q = `
      INSERT INTO categories (name, slug, description, color, sort_order, is_active, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING *
    `;
    
    const result = await pool.query(q, [
      name.trim(),
      finalSlug,
      description?.trim() || null,
      color || '#3B82F6',
      sortOrder
    ]);
    
    return res.status(201).json({
      message: "Category created successfully!",
      category: result.rows[0]
    });
    
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json("Token is not valid!");
    }
    console.error('Database error in addCategory:', err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
};
