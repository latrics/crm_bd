import asyncHandler from '../utils/asyncHandler.js';

// Check if user has specific permission
// Hierarchy: super_admin has '*' which matches everything
export const checkPermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    const userRole = req.user.role?.toLowerCase() || '';

    // Super Admin has all permissions
    if (['super_admin', 'superadmin'].includes(userRole)) {
      return next();
    }

    // Define fixed permissions per role
    const rolePermissions = {
      admin: [
        'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
        'deals.view', 'deals.create', 'deals.edit', 'deals.delete',
        'tenders.view', 'tenders.create', 'tenders.edit', 'tenders.delete',
        'docs.view', 'docs.create', 'docs.delete',
        'exports.view', 'exports.create',
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'audit.view'
      ],
      manager: [
        'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
        'deals.view', 'deals.create', 'deals.edit', 'deals.delete',
        'tenders.view', 'tenders.create', 'tenders.edit', 'tenders.delete',
        'docs.view', 'docs.create', 'docs.delete',
        'exports.view', 'exports.create'
      ],
      member: [
        'leads.view', 'leads.create', 'leads.edit', // Can't delete
        'deals.view', 'deals.create', 'deals.edit',
        'tenders.view', 'tenders.create', 'tenders.edit',
        'docs.view', 'docs.create'
      ]
    };

    const allowedPermissions = rolePermissions[userRole] || [];

    if (!allowedPermissions.includes(permission)) {
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
    'superadmin': 0,
    'super_admin': 0,
    'admin': 1,
    'manager': 2,
    'employee': 3
  };

  // If user is superadmin, they can bypass hierarchy checks
  const userRole = req.user.role?.toLowerCase() || '';
  if (['super_admin', 'superadmin'].includes(userRole)) {
    return next();
  }

  // To be implemented in user update/delete routes:
  // compare roleHierarchy[req.user.role] with roleHierarchy[targetUser.role]
  // if req.user is lower or equal (higher number), they can't modify higher role user
  next();
});
