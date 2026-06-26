import express from 'express';
import { 
  logout, 
  getMe, 
  syncUser,
  verifyInvite
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/sync-user', syncUser);
router.get('/verify-invite', verifyInvite);

export default router;
