import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { verifyAuthToken } from '../utils/authToken.js';
import { clerkClient } from '@clerk/express';

export const protect = asyncHandler(async (req, res, next) => {
  // 1. Check Clerk authentication first
  if (req.auth && req.auth.userId) {
    try {
      const clerkUser = await clerkClient.users.getUser(req.auth.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
      
      if (!email) {
        return res.status(401).json({ success: false, message: 'Clerk user has no email address' });
      }

      let user = await User.findOne({ email });
      if (!user) {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          user = await User.create({
            name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 'Admin User',
            email,
            password: 'clerk-managed-auth',
            role: 'superadmin',
            isActive: true
          });
        } else {
          const Invite = (await import('../models/Invite.js')).default;
          const invite = await Invite.findOne({ email, used: false });
          if (invite) {
            user = await User.create({
              name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : email.split('@')[0],
              email,
              password: 'clerk-managed-auth',
              role: invite.role || 'member',
              isActive: true
            });
            invite.used = true;
            await invite.save();
          } else {
            return res.status(403).json({ 
              success: false, 
              message: 'Your email is not authorized to access this system. Please ask an administrator for an invitation.' 
            });
          }
        }
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'User account is not active' });
      }

      const now = new Date();
      if (!user.lastActiveAt || (now - new Date(user.lastActiveAt)) > 10000) {
        user.lastActiveAt = now;
        await user.save({ validateBeforeSave: false });
      }

      req.user = user;
      req.user.id = user._id.toString();
      req.user.userId = user._id.toString();
      return next();
    } catch (err) {
      console.error('Clerk auth error in protect:', err);
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
  }

  // 2. Fallback to legacy JWT token auth
  let token;

  // Check cookies first
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  // Fallback to authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = verifyAuthToken(token);
    const userId = decoded.id || decoded.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is not active' });
    }

    // Update lastActiveAt if it has been more than 10 seconds since the last update
    const now = new Date();
    if (!user.lastActiveAt || (now - new Date(user.lastActiveAt)) > 10000) {
      user.lastActiveAt = now;
      await user.save({ validateBeforeSave: false });
    }

    req.user = user;
    req.user.id = user._id.toString();
    req.user.userId = user._id.toString(); // helper property matching spec controllers
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
});

// Grant access to specific roles middleware
export const authorize = (...roles) => {
  const normalizedRoles = roles.map(r => r.replace('_', '').toLowerCase());
  return (req, res, next) => {
    const userRole = req.user && req.user.role ? req.user.role.replace('_', '').toLowerCase() : 'guest';
    if (!req.user || !normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'Guest'} is not authorized to access this route`
      });
    }
    next();
  };
};
