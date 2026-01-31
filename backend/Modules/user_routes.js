import express from 'express';
const router = express.Router();
import { getProfile, updateProfile } from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
