import express from 'express';
import { 
  login, 
  logout, 
  getMe, 
  verifyInvite, 
  acceptInvite,
  updatePassword
} from '../controllers/authController.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);
router.get('/verify-invite', verifyInvite);
router.post('/accept-invite', acceptInvite);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

export default router;
