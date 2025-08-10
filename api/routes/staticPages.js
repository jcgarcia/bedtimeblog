import express from 'express';
import {
  getAllPages,
  getMenuPages,
  getPageBySlug,
  getPageById,
  createPage,
  updatePage,
  deletePage
} from '../controllers/staticPages.js';

const router = express.Router();

// Middleware to check if user is admin (you may need to adjust this based on your auth system)
const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin', 'editor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Public routes
router.get('/menu', getMenuPages);           // GET /api/pages/menu - Get pages for navigation menu
router.get('/slug/:slug', getPageBySlug);    // GET /api/pages/slug/about - Get page by slug (public)

// Admin routes (require authentication)
router.get('/', requireAdmin, getAllPages);           // GET /api/pages - Get all pages (admin)
router.get('/:id', requireAdmin, getPageById);        // GET /api/pages/1 - Get page by ID (admin)
router.post('/', requireAdmin, createPage);           // POST /api/pages - Create new page
router.put('/:id', requireAdmin, updatePage);         // PUT /api/pages/1 - Update page
router.delete('/:id', requireAdmin, deletePage);      // DELETE /api/pages/1 - Delete page

export default router;
