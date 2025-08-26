import { getDbPool } from '../db.js';

// Get all static pages (for admin)
export const getAllPages = async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query(
      'SELECT * FROM static_pages ORDER BY menu_order ASC, title ASC'
    );
    // Gracefully handle invalid Lexical JSON in content field
    const pages = result.rows.map(page => {
      try {
        if (page.content && typeof page.content === 'string') {
          page.content = JSON.parse(page.content);
        }
      } catch (e) {
        // If content is not valid JSON, keep as plain text
      }
      return page;
    });
    res.json({
      success: true,
      pages
    });
  } catch (error) {
    console.error('Error fetching all pages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pages',
      error: error.message
    });
  }
};

// Get active pages for menu
export const getMenuPages = async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query(
      'SELECT slug, title FROM static_pages WHERE is_published = true AND show_in_menu = true ORDER BY menu_order ASC'
    );
    
    res.json({
      success: true,
      pages: result.rows
    });
  } catch (error) {
    console.error('Error fetching menu pages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu pages',
      error: error.message
    });
  }
};

// Get single page by slug
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const pool = getDbPool();
    const result = await pool.query(
      'SELECT * FROM static_pages WHERE slug = $1 AND is_published = true',
      [slug]
    );
    if (result.rows.length === 0) {
      // If not found, return JSON not HTML
      return res.status(404).json({
        success: false,
        page: null,
        message: 'Page not found'
      });
    }
    // Parse Lexical JSON if possible
    let page = result.rows[0];
    try {
      if (page.content && typeof page.content === 'string') {
        page.content = JSON.parse(page.content);
      }
    } catch (e) {
      // If content is not valid JSON, keep as plain text
    }
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      page
    });
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching page',
      error: error.message
    });
  }
};

// Get single page by ID (for editing)
export const getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();
    const result = await pool.query(
      'SELECT * FROM static_pages WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    
    res.json({
      success: true,
      page: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching page by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching page',
      error: error.message
    });
  }
};

// Create new page
export const createPage = async (req, res) => {
  try {
    const { slug, title, meta_title, meta_description, content, excerpt, is_published, show_in_menu, menu_order } = req.body;
    const userId = req.adminUser.id;

    // Lexical JSON validation
    let lexicalContent;
    try {
      lexicalContent = typeof content === 'string' ? JSON.parse(content) : content;
      if (!lexicalContent || !lexicalContent.root || !Array.isArray(lexicalContent.root.children)) {
        throw new Error('Invalid Lexical JSON structure');
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Content must be valid Lexical JSON',
        error: e.message
      });
    }

    const pool = getDbPool();
    const result = await pool.query(
      `INSERT INTO static_pages 
       (slug, title, meta_title, meta_description, content, excerpt, is_published, show_in_menu, menu_order, created_by, updated_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [slug, title, meta_title, meta_description, JSON.stringify(lexicalContent), excerpt, is_published, show_in_menu, menu_order, userId, userId]
    );
    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      page: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating page',
      error: error.message
    });
  }
};

// Update existing page
export const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title, meta_title, meta_description, content, excerpt, is_published, show_in_menu, menu_order } = req.body;
    const userId = req.adminUser.id;

    // Lexical JSON validation
    let lexicalContent;
    try {
      lexicalContent = typeof content === 'string' ? JSON.parse(content) : content;
      if (!lexicalContent || !lexicalContent.root || !Array.isArray(lexicalContent.root.children)) {
        throw new Error('Invalid Lexical JSON structure');
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Content must be valid Lexical JSON',
        error: e.message
      });
    }

    const pool = getDbPool();
    const result = await pool.query(
      `UPDATE static_pages 
       SET slug = $1, title = $2, meta_title = $3, meta_description = $4, content = $5, 
           excerpt = $6, is_published = $7, show_in_menu = $8, menu_order = $9, updated_by = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 
       RETURNING *`,
      [slug, title, meta_title, meta_description, JSON.stringify(lexicalContent), excerpt, is_published, show_in_menu, menu_order, userId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    res.json({
      success: true,
      message: 'Page updated successfully',
      page: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating page',
      error: error.message
    });
  }
};

// Delete page
export const deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = getDbPool();
    const result = await pool.query(
      'DELETE FROM static_pages WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Page deleted successfully',
      page: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting page',
      error: error.message
    });
  }
};
