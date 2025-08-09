import { getDbPool } from "../db.js";

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
