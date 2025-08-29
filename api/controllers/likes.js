import { getDbPool } from '../db.js';

export async function getLikes(req, res) {
  const { postId } = req.params;
  const pool = getDbPool();
  try {
    const result = await pool.query('SELECT COUNT(*) AS likes FROM post_likes WHERE post_id = $1', [postId]);
    res.json({ likes: result.rows[0].likes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
}

export async function addLike(req, res) {
  const { postId } = req.params;
  const userId = req.body.userId; // Replace with req.user.id if using auth
  const pool = getDbPool();
  try {
    await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [postId, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add like' });
  }
}

export async function removeLike(req, res) {
  const { postId } = req.params;
  const userId = req.body.userId; // Replace with req.user.id if using auth
  const pool = getDbPool();
  try {
    await pool.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove like' });
  }
}
