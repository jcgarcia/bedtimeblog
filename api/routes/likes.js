import express from 'express';
import { addLike, removeLike, getLikes } from '../controllers/likes.js';

const router = express.Router();

// Get likes for a post
router.get('/:postId', getLikes);

// Add a like to a post
router.post('/:postId', addLike);

// Remove a like from a post
router.delete('/:postId', removeLike);

export default router;
