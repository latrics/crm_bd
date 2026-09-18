import express from 'express';
import { 
  logout, 
  getMe, 
  syncUser,
  verifyInvite,
  getOwners,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/sync-user', syncUser);
router.get('/verify-invite', verifyInvite);
router.get('/owners', protect, getOwners);

export default router;
