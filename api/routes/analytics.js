import express from 'express';
import { getDashboardAnalytics, getPostAnalytics } from '../controllers/analytics.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Dashboard analytics (admin only)
router.get('/dashboard', authenticateAdmin, getDashboardAnalytics);

// Detailed post analytics (admin only)  
router.get('/posts', authenticateAdmin, getPostAnalytics);

export default router;