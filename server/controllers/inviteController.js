import Invite from '../models/Invite.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateRawToken, hashToken } from '../utils/inviteToken.js';
import { sendInviteEmail } from '../utils/email.js';
import { log as auditLog } from '../utils/auditLog.js';

// @desc    Create and send user invitation
// @route   POST /api/v1/admin/invite
// @access  Private/SuperAdmin (or Admin if allowed)
export const createInvite = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ success: false, message: 'Email and role are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role.trim().toLowerCase();

  // Validate role
  if (!['admin', 'manager', 'member'].includes(cleanRole)) {
    return res.status(400).json({ success: false, message: 'Only admin, manager, or member roles can be invited' });
  }

  // Check if an active user already exists with this email
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User with this email already exists' });
  }

  // Clean up any existing unused invites for this email
  await Invite.deleteMany({ email: cleanEmail, used: false });

  // Generate cryptographically secure invite token
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  // Set expiration (24 hours)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Create invite record
  const invite = await Invite.create({
    email: cleanEmail,
    role: cleanRole,
    tokenHash,
    expiresAt,
    invitedBy: req.user.id || req.user._id // from protect middleware
  });

  // Build the setup URL
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const inviteUrl = `${clientOrigin}/accept-invite?token=${rawToken}`;

  // Send the invitation email
  try {
    await sendInviteEmail(cleanEmail, cleanRole, inviteUrl);
  } catch (error) {
    console.error('Failed to send invite email:', error);
    // Continue anyway so they can still copy the link manually
  }

  // Audit log the action
  await auditLog({
    userId: req.user.id || req.user._id,
    action: 'INVITE_USER',
    entity: 'Invite',
    entityId: invite._id.toString(),
    ip: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: 'Invitation generated successfully',
    data: {
      email: cleanEmail,
      role: cleanRole,
      expiresAt,
      link: inviteUrl
    }
  });
});
