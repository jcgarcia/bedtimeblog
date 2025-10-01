import { getDbPool } from '../db.js';
import jwt from 'jsonwebtoken';

// Get comments for a post (with threading support)
export async function getComments(req, res) {
  const { postId } = req.params;
  const pool = getDbPool();
  
  try {
    // Get all comments for the post with user information
    const result = await pool.query(`
      SELECT 
        c.id, c.post_id, c.parent_id, c.content, c.status,
        c.created_at, c.updated_at, c.user_id,
        u.username, u.first_name, u.last_name,
        c.author_name, c.author_email  -- Legacy fields for backward compatibility
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.status != 'deleted'
      ORDER BY c.created_at ASC
    `, [postId]);
    
    // Build threaded comment structure
    const comments = [];
    const commentMap = new Map();
    
    // First pass: create comment objects
    result.rows.forEach(row => {
      const comment = {
        id: row.id,
        postId: row.post_id,
        parentId: row.parent_id,
        content: row.content,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        author: {
          id: row.user_id,
          username: row.username,
          firstName: row.first_name,
          lastName: row.last_name,
          displayName: row.first_name && row.last_name 
            ? `${row.first_name} ${row.last_name}`
            : row.username || row.author_name
        },
        replies: []
      };
      
      commentMap.set(row.id, comment);
      
      if (!row.parent_id) {
        comments.push(comment);
      }
    });
    
    // Second pass: build reply structure
    result.rows.forEach(row => {
      if (row.parent_id) {
        const parent = commentMap.get(row.parent_id);
        const child = commentMap.get(row.id);
        if (parent && child) {
          parent.replies.push(child);
        }
      }
    });
    
    res.json({
      success: true,
      comments: comments,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

// Add a new comment
export async function addComment(req, res) {
  const { postId } = req.params;
  const { content, parentId } = req.body;
  const pool = getDbPool();
  
  // Check for authentication
  const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required to comment' });
  }
  
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Comment is too long (max 2000 characters)' });
    }
    
    // Validate parent comment exists if parentId provided
    if (parentId) {
      const parentCheck = await pool.query(
        'SELECT id FROM comments WHERE id = $1 AND post_id = $2', 
        [parentId, postId]
      );
      
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Parent comment not found' });
      }
    }
    
    // Insert new comment
    const result = await pool.query(`
      INSERT INTO comments (post_id, user_id, parent_id, content, status)
      VALUES ($1, $2, $3, $4, 'approved')
      RETURNING id, created_at
    `, [postId, userInfo.id, parentId || null, content.trim()]);
    
    const commentId = result.rows[0].id;
    const createdAt = result.rows[0].created_at;
    
    // Update comment count in posts table
    const countResult = await pool.query('SELECT COUNT(*) AS count FROM comments WHERE post_id = $1 AND status != \'deleted\'', [postId]);
    const newCommentCount = parseInt(countResult.rows[0].count);
    
    await pool.query('UPDATE posts SET comment_count = $1 WHERE id = $2', [newCommentCount, postId]);
    
    // Get user info for response
    const userResult = await pool.query(
      'SELECT username, first_name, last_name FROM users WHERE id = $1', 
      [userInfo.id]
    );
    
    const user = userResult.rows[0];
    
    res.json({
      success: true,
      comment: {
        id: commentId,
        postId: parseInt(postId),
        parentId: parentId ? parseInt(parentId) : null,
        content: content.trim(),
        status: 'approved',
        createdAt: createdAt,
        author: {
          id: userInfo.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          displayName: user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.username
        },
        replies: []
      },
      commentCount: newCommentCount
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

// Update a comment (edit)
export async function updateComment(req, res) {
  const { commentId } = req.params;
  const { content } = req.body;
  const pool = getDbPool();
  
  // Check for authentication
  const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Comment is too long (max 2000 characters)' });
    }
    
    // Check if comment exists and user owns it (or is admin)
    const commentCheck = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1', 
      [commentId]
    );
    
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const isOwner = commentCheck.rows[0].user_id === userInfo.id;
    const isAdmin = ['admin', 'super_admin'].includes(userInfo.role);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }
    
    // Update comment
    await pool.query(`
      UPDATE comments 
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [content.trim(), commentId]);
    
    res.json({
      success: true,
      message: 'Comment updated successfully'
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
}

// Delete a comment (soft delete)
export async function deleteComment(req, res) {
  const { commentId } = req.params;
  const pool = getDbPool();
  
  // Check for authentication
  const token = req.cookies.access_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if comment exists and user owns it (or is admin)
    const commentCheck = await pool.query(
      'SELECT user_id, post_id FROM comments WHERE id = $1', 
      [commentId]
    );
    
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const isOwner = commentCheck.rows[0].user_id === userInfo.id;
    const isAdmin = ['admin', 'super_admin'].includes(userInfo.role);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    const postId = commentCheck.rows[0].post_id;
    
    // Soft delete comment (preserve threading structure)
    await pool.query(`
      UPDATE comments 
      SET status = 'deleted', content = '[deleted]', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [commentId]);
    
    // Update comment count in posts table
    const countResult = await pool.query('SELECT COUNT(*) AS count FROM comments WHERE post_id = $1 AND status != \'deleted\'', [postId]);
    const newCommentCount = parseInt(countResult.rows[0].count);
    
    await pool.query('UPDATE posts SET comment_count = $1 WHERE id = $2', [newCommentCount, postId]);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully',
      commentCount: newCommentCount
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}