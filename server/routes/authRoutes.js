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
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);
router.get('/verify-invite', verifyInvite);
router.post('/accept-invite', acceptInvite);
router.get('/me', authenticate, getMe);
router.put('/update-password', authenticate, updatePassword);

export default router;
