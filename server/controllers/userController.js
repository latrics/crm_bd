import User from '../models/User.js';
import Role from '../models/Role.js';
import asyncHandler from '../utils/asyncHandler.js';
import { clerkClient } from '@clerk/express';
import { log as auditLog } from '../utils/auditLog.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt').lean();

  // Also fetch active invitations
  const Invitation = (await import('../models/Invitation.js')).default;
  const invites = await Invitation.find({ status: { $in: ['pending', 'opened'] } }).sort('-createdAt').lean();

  // Format invites to match user shape for the frontend
  const formattedInvites = invites.map(inv => ({
    _id: inv._id,
    name: inv.email.split('@')[0], // placeholder name
    email: inv.email,
    role: inv.role,
    isActive: false,
    isInvite: true,
    inviteStatus: inv.status, // 'pending' or 'opened'
    createdAt: inv.createdAt
  }));

  const combined = [...formattedInvites, ...users];
  res.status(200).json({ success: true, count: combined.length, data: combined });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, data: user });
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = asyncHandler(async (req, res) => {
  // Check if user has permission to create users
  const user = await User.create({
    ...req.body,
    createdBy: req.user.id
  });
  res.status(201).json({ success: true, data: user });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // If password is included in request, assign it to trigger pre-save hashing hook
  if (req.body.password) {
    user.password = req.body.password;
    delete req.body.password;
  }

  // Assign other fields
  Object.keys(req.body).forEach(key => {
    user[key] = req.body[key];
  });

  await user.save();

  res.status(200).json({ success: true, data: user });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Delete user from Clerk if they have a clerkId
  if (user.clerkId) {
    try {
      await clerkClient.users.deleteUser(user.clerkId);
      console.log(`Successfully deleted Clerk user ${user.clerkId} for ${user.email}`);
    } catch (clerkErr) {
      console.error(`Failed to delete Clerk user ${user.clerkId}:`, clerkErr.message);
      // Continue deleting from MongoDB even if Clerk deletion fails
    }
  }

  await user.deleteOne();

  res.status(200).json({ success: true, data: {} });
});
