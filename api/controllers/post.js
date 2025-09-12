import { getDbPool } from "../db.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const pool = getDbPool();
  try {
    let q, result;
    if (req.query.cat) {
      // Filter by category slug (name) instead of ID
      q = `
        SELECT p.*, u.username, u.first_name, u.last_name, u.email, c.name as category_name, c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (LOWER(c.slug) = LOWER($1) OR LOWER(c.name) = LOWER($1))
        AND p.status = 'published'
        ORDER BY p.created_at DESC
      `;
      result = await pool.query(q, [req.query.cat]);
    } else {
      q = `
        SELECT p.*, u.username, u.first_name, u.last_name, u.email, c.name as category_name, c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
      `;
      result = await pool.query(q);
    }
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error in getPosts:', err);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const getDrafts = async (req, res) => {
  const pool = getDbPool();
  try {
    let q, result;
    if (req.query.cat) {
      // Filter by category slug (name) instead of ID
      q = `
        SELECT p.*, u.username, u.first_name, u.last_name, u.email, c.name as category_name, c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (LOWER(c.slug) = LOWER($1) OR LOWER(c.name) = LOWER($1))
        AND p.status = 'draft'
        ORDER BY p.created_at DESC
      `;
      result = await pool.query(q, [req.query.cat]);
    } else {
      q = `
        SELECT p.*, u.username, u.first_name, u.last_name, u.email, c.name as category_name, c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'draft'
        ORDER BY p.created_at DESC
      `;
      result = await pool.query(q);
    }
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error in getDrafts:', err);
    return res.status(500).json({ error: 'Failed to fetch drafts' });
  }
};

export const getPost = async (req, res) => {
  const pool = getDbPool();
  try {
    // Join with users table and categories table to get author and category information
    const q = `
      SELECT p.*, u.username, u.first_name, u.last_name, u.email, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    const result = await pool.query(q, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Database error in getPost:', err);
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const addPost = async (req, res) => {
  const pool = getDbPool();
  
  // Check for token in both cookie and Authorization header
  const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }
  
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Generate unique slug from title
    let baseSlug = req.body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and add suffix if needed
    while (true) {
      try {
        const existingPost = await pool.query('SELECT id FROM posts WHERE slug = $1', [slug]);
        if (existingPost.rows.length === 0) {
          break; // Slug is unique
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
      } catch (error) {
        console.error('Error checking slug uniqueness:', error);
        // If database error, use timestamp suffix as fallback
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }
    
    const q = `
      INSERT INTO posts(title, slug, content, featured_image, category_id, author_id, status, published_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const values = [
      req.body.title,
      slug,
      req.body.desc,
      req.body.img,
      req.body.cat,
      userInfo.id,
      'published',
      new Date()
    ];
    
    const result = await pool.query(q, values);
    return res.json({ message: "Post has been created.", post: result.rows[0] });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json("Token is not valid!");
    }
    console.error('Database error in addPost:', err);
    return res.status(500).json({ error: 'Failed to create post' });
  }
};

export const deletePost = async (req, res) => {
  const pool = getDbPool();
  
  // Check for token in both cookie and Authorization header
  const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }
  
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const postId = req.params.id;
    const q = "DELETE FROM posts WHERE id = $1 AND author_id = $2";
    
    const result = await pool.query(q, [postId, userInfo.id]);
    
    if (result.rowCount === 0) {
      return res.status(403).json("You can delete only your post!");
    }
    
    return res.json("Post has been deleted!");
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json("Token is not valid!");
    }
    console.error('Database error in deletePost:', err);
    return res.status(403).json("You can delete only your post!");
  }
};

export const updatePost = async (req, res) => {
  const pool = getDbPool();
  
  // Check for token in both cookie and Authorization header
  const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }
  
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const postId = req.params.id;
    
    // Generate slug from title if title is provided
    let slug = null;
    if (req.body.title) {
      slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    const q = `
      UPDATE posts 
      SET title=$1, slug=$2, content=$3, featured_image=$4, category_id=$5, status=$6, updated_at=CURRENT_TIMESTAMP 
      WHERE id = $7 AND author_id = $8
      RETURNING *
    `;
    const values = [
      req.body.title, 
      slug, 
      req.body.content || req.body.desc, 
      req.body.img, 
      req.body.cat, 
      req.body.status,
      postId, 
      userInfo.id
    ];
    
    const result = await pool.query(q, values);
    
    if (result.rowCount === 0) {
      return res.status(403).json("You can update only your post!");
    }
    
    return res.json({ message: "Post has been updated.", post: result.rows[0] });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json("Token is not valid!");
    }
    console.error('Database error in updatePost:', err);
    return res.status(500).json({ error: 'Failed to update post' });
  }
};
