import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { getAuth } from '@clerk/express';

export const protect = asyncHandler(async (req, res, next) => {
  // Clerk Express v2+ usage
  const authState = getAuth(req);
  
  console.log(`[PROTECT] Hit route: ${req.originalUrl}`);
  console.log(`[PROTECT] authState object:`, authState);

  // 1. Clerk provides Identity (Session)
  if (!authState || !authState.userId) {
    console.log(`[PROTECT] Rejecting: No Clerk session!`);
    return res.status(401).json({ success: false, message: 'Not authorized, no Clerk session' });
  }

  try {
    const clerkId = authState.userId;
    console.log(`[PROTECT] Found clerkId: ${clerkId}`);

    // 2. MongoDB provides Authority (Roles & Permissions)
    const user = await User.findOne({ clerkId });

    if (!user) {
      // If no matching clerkId, it might be their very first request or an uninvited user.
      // We return 403. The frontend should handle 403 or ensure /sync-user is called on login.
      return res.status(403).json({ success: false, message: 'User not found in system or not invited' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is not active' });
    }

    // Attach user for downstream authorize middleware
    req.user = user;
    req.user.id = user._id.toString();
    req.user.userId = user._id.toString();
    return next();
  } catch (err) {
    console.error('Auth error in protect middleware:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
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
