import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { log as auditLog } from '../utils/auditLog.js';
import { clearAuthCookie } from '../utils/authToken.js';



// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  if (req.user && req.user.id) {
    await auditLog({
      userId: req.user.id,
      action: 'LOGOUT',
      entity: 'User',
      ip: req.ip,
      meta: {
        message: `${req.user.role === 'superadmin' ? 'Super Admin' : req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} ${req.user.name} logged out`
      },
      severity: 'info'
    });
  }

  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: 'You have been logged out successfully.' });
});

// @desc    Get current logged in user info
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id || req.user._id);
  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, message: 'Your account could not be found or has been deactivated. Please contact your administrator.' });
  }
  return res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  });
});

import Invitation from '../models/Invitation.js';

// @desc    Verify Invitation Token
// @route   GET /api/v1/auth/verify-invite
// @access  Public
export const verifyInvite = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'An invitation token is required to proceed.' });
  }

  const invitation = await Invitation.findOne({ token });

  if (!invitation) {
    return res.status(404).json({ success: false, message: 'The invitation link is invalid or has expired. Please request a new invitation.' });
  }

  if (invitation.status === 'accepted') {
    return res.status(400).json({ success: false, message: 'This invitation has already been accepted. Please log in.' });
  }

  if (invitation.status === 'expired' || new Date() > new Date(invitation.expiresAt)) {
    invitation.status = 'expired';
    await invitation.save();
    return res.status(400).json({ success: false, message: 'This invitation has expired. Please ask your administrator to send a new one.' });
  }

  if (invitation.status === 'pending') {
    invitation.status = 'opened';
    await invitation.save();
  }

  return res.status(200).json({
    success: true,
    data: {
      email: invitation.email,
      role: invitation.role
    }
  });
});

// @desc    Sync Clerk User with MongoDB
// @route   POST /api/v1/auth/sync-user
// @access  Public (Called by frontend after Clerk login)
export const syncUser = asyncHandler(async (req, res) => {
  const { clerkId, email, name } = req.body;

  if (!clerkId || !email) {
    return res.status(400).json({ success: false, message: 'Authentication failed: Missing Clerk ID or email.' });
  }

  const cleanEmail = email.toLowerCase();

  // Find MongoDB user by email
  let user = await User.findOne({ email: cleanEmail });

  if (!user) {
    // SECURITY: Do not auto-create users. They must be invited.
    // If the DB is completely empty, allow bootstrapping the first superadmin.
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      user = await User.create({
        name: name || 'Admin User',
        email: cleanEmail,
        clerkId,
        role: 'superadmin',
        isActive: true
      });
      return res.status(200).json({
        success: true,
        role: user.role,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    }

    // Lookup invitation
    const invitation = await Invitation.findOne({ 
      email: cleanEmail, 
      status: { $in: ['pending', 'opened'] } 
    });

    if (!invitation) {
      return res.status(403).json({ success: false, message: 'You must be invited to join this workspace, or your invitation has expired.' });
    }

    // Create the actual user record
    try {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        clerkId,
        role: invitation.role,
        isActive: true
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        // Query again to check if user was created in parallel
        user = await User.findOne({ email: cleanEmail });
        if (!user) {
          throw createErr;
        }
      } else {
        throw createErr;
      }
    }

    // Mark invitation as accepted
    invitation.status = 'accepted';
    await invitation.save();

  } else {
    // User already exists (returning login or re-sync)
    let isUpdated = false;
    if (!user.clerkId || user.clerkId !== clerkId) {
      user.clerkId = clerkId;
      isUpdated = true;
    }
    user.lastActiveAt = new Date();
    await user.save();
  }

  return res.status(200).json({
    success: true,
    role: user.role,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

