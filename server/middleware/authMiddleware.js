import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  // ---- AUTHENTICATION PAUSED FOR PRESENTATION ----
  req.user = { _id: "662a6e60b1341a001c900000", name: "Presenter", role: "super_admin", isActive: true };
  return next();
  // ------------------------------------------------
  /*
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is deactivated' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
  */
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    // ---- AUTHENTICATION PAUSED FOR PRESENTATION ----
    return next();
    // ------------------------------------------------
    /*
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
    */
  };
};
