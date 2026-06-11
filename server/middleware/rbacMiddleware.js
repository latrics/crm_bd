import asyncHandler from '../utils/asyncHandler.js';

// Check if user has specific permission
// Hierarchy: super_admin has '*' which matches everything
export const checkPermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    const userPermissions = req.user.permissions || [];

    // Super Admin has all permissions
    if (req.user.role === 'super_admin' || userPermissions.includes('*')) {
      return next();
    }

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission: ${permission}`
      });
    }

    next();
  });
};

// Check if user is higher in hierarchy than target user
export const checkHierarchy = asyncHandler(async (req, res, next) => {
  const roleHierarchy = {
    'super_admin': 0,
    'admin': 1,
    'manager': 2,
    'employee': 3
  };

  // If user is super_admin, they can bypass hierarchy checks for everyone except other super_admins (handled in logic)
  if (req.user.role === 'super_admin') {
    return next();
  }

  // To be implemented in user update/delete routes:
  // compare roleHierarchy[req.user.role] with roleHierarchy[targetUser.role]
  // if req.user is lower or equal (higher number), they can't modify higher role user
  next();
});
