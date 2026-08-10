import express from 'express';
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/userController.js';
import { createInvite, revokeInvite, resendInvite } from '../controllers/inviteController.js';
import { getApprovals, updateApproval } from '../controllers/approvalController.js';
import AuditLog from '../models/AuditLog.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
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

// Hard Reset Audit Logs - SUPER ADMIN ONLY
router.post('/audit-logs/reset', authorize('superadmin'), asyncHandler(async (req, res) => {
  await AuditLog.deleteMany({});

  // Record the hard reset action permanently
  const resetLog = await AuditLog.create({
    user_id: req.user._id,
    user_name: req.user.name || req.user.email,
    user_role: req.user.role,
    action: 'HARD_RESET',
    entity: 'AuditLog',
    severity: 'critical',
    meta: {
      description: `Audit logs hard reset performed by Super Admin ${req.user.name || req.user.email}`
    }
  });

  res.status(200).json({
    success: true,
    message: 'Audit logs reset successfully. The reset action has been recorded in the audit trail.',
    data: [resetLog]
  });
}));

// Approvals Route
router.route('/approvals')
  .get(checkPermission('audit.view'), getApprovals);

// Hard Reset Approvals - SUPER ADMIN ONLY
router.post('/approvals/reset', authorize('superadmin'), asyncHandler(async (req, res) => {
  // Count pending deletion requests before resetting
  const pendingDeletionsCount = await ApprovalRequest.countDocuments({ status: 'Pending', type: 'Delete' });

  // Delete all approval requests (revoking any pending delete requests by default so lead/deal data is preserved)
  await ApprovalRequest.deleteMany({});

  // Record the hard reset action in Audit Logs permanently with explicit revocation detail
  await AuditLog.create({
    user_id: req.user._id,
    user_name: req.user.name || req.user.email,
    user_role: req.user.role,
    action: 'HARD_RESET',
    entity: 'ApprovalCenter',
    severity: 'critical',
    meta: {
      description: `Approval Center hard reset performed by Super Admin ${req.user.name || req.user.email}. ${pendingDeletionsCount} pending deletion request(s) were revoked, ensuring no lead or deal data was removed.`
    }
  });

  res.status(200).json({
    success: true,
    message: `Approval Center reset successfully. ${pendingDeletionsCount > 0 ? `${pendingDeletionsCount} pending deletion request(s) were automatically revoked. ` : ''}All lead and deal data remains fully intact.`
  });
}));

router.route('/approvals/:id')
  .put(checkPermission('audit.view'), updateApproval);

export default router;
