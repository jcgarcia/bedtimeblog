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
        WHERE LOWER(c.slug) = LOWER($1) OR LOWER(c.name) = LOWER($1)
        ORDER BY p.created_at DESC
      `;
      result = await pool.query(q, [req.query.cat]);
    } else {
      q = `
        SELECT p.*, u.username, u.first_name, u.last_name, u.email, c.name as category_name, c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
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
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }
  
  try {
    const userInfo = jwt.verify(token, "jwtkey");
    
    // Use PostgreSQL schema column names
    const title = req.body.title;
    const content = req.body.desc || req.body.content; // Support both legacy and new field names
    const featured_image = req.body.img;
    const category_id = req.body.cat || req.body.category_id;
    const published_at = req.body.date ? new Date(req.body.date) : new Date();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const q = `
      INSERT INTO posts (title, slug, content, featured_image, category_id, author_id, published_at, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `;
    const values = [
      title,
      slug,
      content,
      featured_image,
      category_id,
      userInfo.id,
      published_at,
      'published' // Set status as published for web interface posts
    ];
    
    const result = await pool.query(q, values);
    return res.json({
      message: "Post has been created.",
      postId: result.rows[0].id,
      slug: slug
    });
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
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }
  
  try {
    const userInfo = jwt.verify(token, "jwtkey");
    const postId = req.params.id;
    
    // Use PostgreSQL schema column names
    const q = "DELETE FROM posts WHERE id = $1 AND author_id = $2";
    
    const result = await pool.query(q, [postId, userInfo.id]);
    
    if (result.rowCount === 0) {
      return res.status(403).json("You can only delete your own posts!");
    }
    
    return res.json("Post has been deleted!");
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json("Token is not valid!");
    }
    console.error('Database error in deletePost:', err);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
};

export const updatePost = async (req, res) => {
  const pool = getDbPool();
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }
  
  try {
    const userInfo = jwt.verify(token, "jwtkey");
    const postId = req.params.id;
    
    // Use PostgreSQL schema column names
    const title = req.body.title;
    const content = req.body.desc || req.body.content; // Support both legacy and new field names
    const featured_image = req.body.img;
    const category_id = req.body.cat || req.body.category_id;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const q = `
      UPDATE posts 
      SET title = $1, content = $2, featured_image = $3, category_id = $4, slug = $5, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $6 AND author_id = $7
    `;
    const values = [title, content, featured_image, category_id, slug, postId, userInfo.id];
    
    const result = await pool.query(q, values);
    
    if (result.rowCount === 0) {
      return res.status(403).json("You can only update your own posts!");
    }
    
    return res.json({
      message: "Post has been updated.",
      slug: slug
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json("Token is not valid!");
    }
    console.error('Database error in updatePost:', err);
    return res.status(500).json({ error: 'Failed to update post' });
  }
};
