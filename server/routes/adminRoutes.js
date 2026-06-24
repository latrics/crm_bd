import express from 'express';
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/userController.js';
import { createInvite, revokeInvite, resendInvite } from '../controllers/inviteController.js';
import AuditLog from '../models/AuditLog.js';
import asyncHandler from '../utils/asyncHandler.js';

import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logActivity } from '../middleware/auditMiddleware.js';

const router = express.Router();

// All routes here require being logged in and having admin/super_admin role
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.post('/invite', checkPermission('users.create'), logActivity('Invite', 'CREATE'), createInvite);
router.delete('/invite/:id', checkPermission('users.delete'), logActivity('Invite', 'DELETE'), revokeInvite);
router.post('/invite/:id/resend', checkPermission('users.create'), logActivity('Invite', 'UPDATE'), resendInvite);

router.route('/users')
  .get(checkPermission('users.view'), getUsers)
  .post(checkPermission('users.create'), logActivity('Users', 'CREATE'), createUser);

router.route('/users/:id')
  .get(checkPermission('users.view'), getUser)
  .put(checkPermission('users.edit'), logActivity('Users', 'UPDATE'), updateUser)
  .delete(checkPermission('users.delete'), logActivity('Users', 'DELETE'), deleteUser);

// Audit Logs Route
router.get('/audit-logs', checkPermission('audit.view'), asyncHandler(async (req, res) => {
  const logs = await AuditLog.find()
    .populate('user_id', 'name email role')
    .sort('-createdAt')
    .limit(100);
  res.status(200).json({ success: true, count: logs.length, data: logs });
}));

export default router;
