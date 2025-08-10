import db from '../db.js';

// Get all static pages (for admin)
export const getAllPages = async (req, res) => {
  try {
    const query = `
      SELECT sp.*, 
             u1.username as created_by_username,
             u2.username as updated_by_username
      FROM static_pages sp
      LEFT JOIN users u1 ON sp.created_by = u1.id
      LEFT JOIN users u2 ON sp.updated_by = u2.id
      ORDER BY sp.menu_order ASC, sp.title ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching static pages:', error);
    res.status(500).json({ error: 'Failed to fetch static pages' });
  }
};

// Get active pages for menu
export const getMenuPages = async (req, res) => {
  try {
    const query = `
      SELECT slug, title, menu_order
      FROM static_pages 
      WHERE status = 'active' AND show_in_menu = TRUE
      ORDER BY menu_order ASC, title ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu pages:', error);
    res.status(500).json({ error: 'Failed to fetch menu pages' });
  }
};

// Get single page by slug
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const query = `
      SELECT sp.*, 
             u1.username as created_by_username,
             u2.username as updated_by_username
      FROM static_pages sp
      LEFT JOIN users u1 ON sp.created_by = u1.id
      LEFT JOIN users u2 ON sp.updated_by = u2.id
      WHERE sp.slug = $1 AND sp.status = 'active'
    `;
    const result = await db.query(query, [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
};

// Get single page by ID (for editing)
export const getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT sp.*, 
             u1.username as created_by_username,
             u2.username as updated_by_username
      FROM static_pages sp
      LEFT JOIN users u1 ON sp.created_by = u1.id
      LEFT JOIN users u2 ON sp.updated_by = u2.id
      WHERE sp.id = $1
    `;
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
};

// Create new page
export const createPage = async (req, res) => {
  try {
    const {
      slug,
      title,
      meta_title,
      meta_description,
      content,
      content_type = 'html',
      status = 'active',
      template = 'default',
      show_in_menu = false,
      menu_order = 0
    } = req.body;

    const userId = req.user?.id;

    // Check if slug already exists
    const existingQuery = 'SELECT id FROM static_pages WHERE slug = $1';
    const existingResult = await db.query(existingQuery, [slug]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Page with this slug already exists' });
    }

    const query = `
      INSERT INTO static_pages (
        slug, title, meta_title, meta_description, content, 
        content_type, status, template, show_in_menu, menu_order, 
        created_by, updated_by
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
      RETURNING *
    `;
    
    const values = [
      slug, title, meta_title, meta_description, content,
      content_type, status, template, show_in_menu, menu_order,
      userId
    ];
    
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
};

// Update page
export const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      title,
      meta_title,
      meta_description,
      content,
      content_type,
      status,
      template,
      show_in_menu,
      menu_order
    } = req.body;

    const userId = req.user?.id;

    // Check if slug is being changed and if new slug already exists
    if (slug) {
      const existingQuery = 'SELECT id FROM static_pages WHERE slug = $1 AND id != $2';
      const existingResult = await db.query(existingQuery, [slug, id]);
      
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: 'Page with this slug already exists' });
      }
    }

    const query = `
      UPDATE static_pages 
      SET slug = COALESCE($1, slug),
          title = COALESCE($2, title),
          meta_title = COALESCE($3, meta_title),
          meta_description = COALESCE($4, meta_description),
          content = COALESCE($5, content),
          content_type = COALESCE($6, content_type),
          status = COALESCE($7, status),
          template = COALESCE($8, template),
          show_in_menu = COALESCE($9, show_in_menu),
          menu_order = COALESCE($10, menu_order),
          updated_by = $11,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;
    
    const values = [
      slug, title, meta_title, meta_description, content,
      content_type, status, template, show_in_menu, menu_order,
      userId, id
    ];
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
};

// Delete page
export const deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM static_pages WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
};
