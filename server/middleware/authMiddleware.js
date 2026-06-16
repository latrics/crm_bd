import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { verifyAuthToken } from '../utils/authToken.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check cookies first
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  // 2. Fallback to authorization header
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
