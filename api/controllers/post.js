import { getDbPool } from "../db.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const pool = getDbPool();
  try {
    let q, result;
    if (req.query.cat) {
      q = "SELECT * FROM posts WHERE cat=$1";
      result = await pool.query(q, [req.query.cat]);
    } else {
      q = "SELECT * FROM posts";
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
    // Use the actual database schema - just select from posts table
    const q = "SELECT * FROM posts WHERE id = $1";
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
    const q =
      "INSERT INTO posts(title, postcont, img, cat, postdate, userid) VALUES ($1, $2, $3, $4, $5, $6)";
    const values = [
      req.body.title,
      req.body.desc,
      req.body.img,
      req.body.cat,
      req.body.date,
      userInfo.id,
    ];
    
    await pool.query(q, values);
    return res.json("Post has been created.");
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
    const q = "DELETE FROM posts WHERE id = $1 AND uid = $2";
    
    await pool.query(q, [postId, userInfo.id]);
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
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }
  
  try {
    const userInfo = jwt.verify(token, "jwtkey");
    const postId = req.params.id;
    const q =
      "UPDATE posts SET title=$1, desc=$2, img=$3, cat=$4 WHERE id = $5 AND uid = $6";
    const values = [req.body.title, req.body.desc, req.body.img, req.body.cat, postId, userInfo.id];
    
    await pool.query(q, values);
    return res.json("Post has been updated.");
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json("Token is not valid!");
    }
    console.error('Database error in updatePost:', err);
    return res.status(500).json({ error: 'Failed to update post' });
  }
};
