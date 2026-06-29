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
    return res.status(401).json({ success: false, message: 'You must be logged in to perform this action. Please log in and try again.' });
  }

  try {
    const clerkId = authState.userId;
    console.log(`[PROTECT] Found clerkId: ${clerkId}`);

    // 2. MongoDB provides Authority (Roles & Permissions)
    const user = await User.findOne({ clerkId });

    if (!user) {
      // If no matching clerkId, it might be their very first request or an uninvited user.
      // We return 403. The frontend should handle 403 or ensure /sync-user is called on login.
      return res.status(403).json({ success: false, message: 'Your account was not found or you have not been invited to this workspace.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact your administrator.' });
    }

    // Attach user for downstream authorize middleware
    req.user = user;
    req.user.id = user._id.toString();
    req.user.userId = user._id.toString();
    return next();
  } catch (err) {
    console.error('Auth error in protect middleware:', err);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred during authentication. Please try again later.' });
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
        message: `You do not have the required permissions (${req.user ? req.user.role : 'Guest'}) to perform this action.`
      });
    }
    next();
  };
};
