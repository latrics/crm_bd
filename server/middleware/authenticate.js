import { verifyAuthToken } from '../utils/authToken.js';
import { clerkClient } from '@clerk/express';
import User from '../models/User.js';

export default async function authenticate(req, res, next) {
  // 1. Check Clerk authentication first
  if (req.auth && req.auth.userId) {
    try {
      const clerkUser = await clerkClient.users.getUser(req.auth.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
      
      if (!email) {
        return res.status(401).json({ success: false, message: 'Clerk user has no email address' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found in system' });
      }

      req.user = user;
      req.user.id = user._id.toString();
      req.user.role = user.role;
      return next();
    } catch (err) {
      console.error('Clerk auth error in authenticate:', err);
      return res.status(401).json({ success: false, message: 'Unauthorized: Clerk authentication failed' });
    }
  }

  // 2. Fallback to legacy JWT token auth
  let token = req.cookies.access_token;
  
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = verifyAuthToken(token);
    req.user = decoded; // Contains { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token expired or invalid' });
  }
}
