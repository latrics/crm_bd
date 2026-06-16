export default function authorize(...allowedRoles) {
  const roles = allowedRoles.flat().map(r => r.replace('_', '').toLowerCase());
  return (req, res, next) => {
    const userRole = req.user && req.user.role ? req.user.role.replace('_', '').toLowerCase() : 'guest';
    if (!req.user || !roles.includes(userRole)) {
      return res.status(403).json({ success: false, message: `Forbidden: User role is not authorized` });
    }
    next();
  };
}
