import crypto from 'crypto';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import asyncHandler from '../utils/asyncHandler.js';
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

  // Check for an existing pending or opened invitation
  let invitation = await Invitation.findOne({ 
    email: cleanEmail, 
    status: { $in: ['pending', 'opened'] } 
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const inviterId = typeof req.auth === 'function' ? req.auth().userId : (req.auth?.userId || req.user?.id || req.user?._id);

  if (inviterId && typeof inviterId === 'string' && inviterId.startsWith('user_')) {
    // We need the MongoDB User ID of the inviter, not the clerkId!
    const inviter = await User.findOne({ clerkId: inviterId });
    if (!inviter) {
      return res.status(401).json({ success: false, message: 'Inviter not found in DB' });
    }
    var dbInviterId = inviter._id;
  } else {
    var dbInviterId = inviterId;
  }

  if (invitation) {
    // Update existing invitation
    invitation.role = cleanRole;
    invitation.token = token;
    invitation.invitedBy = dbInviterId;
    invitation.expiresAt = expiresAt;
    await invitation.save();
  } else {
    // Create new invitation
    invitation = await Invitation.create({
      email: cleanEmail,
      role: cleanRole,
      token,
      invitedBy: dbInviterId,
      expiresAt
    });
  }

  // Build the setup URL - Points to our custom sign-up page
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const inviteUrl = `${clientOrigin}/accept-invite?token=${token}`;

  // Send the invitation email
  try {
    await sendInviteEmail(cleanEmail, cleanRole, inviteUrl);
  } catch (error) {
    console.error('Failed to send invite email:', error);
    // Continue anyway so they can still copy the link manually
  }

  // Audit log the action
  await auditLog({
    userId: dbInviterId,
    action: 'INVITE_USER',
    entity: 'Invitation',
    entityId: invitation._id.toString(),
    ip: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: 'Invitation generated successfully',
    data: {
      email: cleanEmail,
      role: cleanRole,
      link: inviteUrl
    }
  });
});

// @desc    Revoke an invitation
// @route   DELETE /api/v1/admin/invite/:id
// @access  Private/Admin
export const revokeInvite = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findById(req.params.id);

  if (!invitation) {
    return res.status(404).json({ success: false, message: 'Invitation not found' });
  }

  await invitation.deleteOne();

  res.status(200).json({ success: true, message: 'Invitation revoked successfully' });
});

// @desc    Resend an invitation
// @route   POST /api/v1/admin/invite/:id/resend
// @access  Private/Admin
export const resendInvite = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findById(req.params.id);

  if (!invitation) {
    return res.status(404).json({ success: false, message: 'Invitation not found' });
  }

  // Generate a new token and extend expiration
  const token = crypto.randomBytes(32).toString('hex');
  invitation.token = token;
  invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await invitation.save();

  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const inviteUrl = `${clientOrigin}/accept-invite?token=${token}`;

  try {
    await sendInviteEmail(invitation.email, invitation.role, inviteUrl);
  } catch (error) {
    console.error('Failed to resend invite email:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email' });
  }

  res.status(200).json({ success: true, message: 'Invitation resent successfully' });
});
