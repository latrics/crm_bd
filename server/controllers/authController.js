import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Invite from '../models/Invite.js';
import asyncHandler from '../utils/asyncHandler.js';
import { log as auditLog } from '../utils/auditLog.js';
import { hashToken } from '../utils/inviteToken.js';
import { generateAuthToken, setAuthCookie, clearAuthCookie } from '../utils/authToken.js';

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  // Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    // Return generic error message to prevent account fishing
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const passwordMatch = await user.matchPassword(password);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Generate auth token and set in cookie
  const token = generateAuthToken({ id: user._id, role: user.role });
  setAuthCookie(res, token);

  // Log audit
  await auditLog({
    userId: user._id,
    action: 'LOGIN',
    entity: 'User',
    entityId: user._id.toString(),
    ip: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    role: user.role,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  });
});

// @desc    Verify Invite Token
// @route   GET /api/v1/auth/verify-invite
// @access  Public
export const verifyInvite = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  const tokenHash = hashToken(token);
  const invite = await Invite.findOne({ tokenHash, used: false });

  if (!invite) {
    return res.status(404).json({ success: false, message: 'Invitation not found or already used' });
  }

  if (invite.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Invitation has expired' });
  }

  return res.status(200).json({
    success: true,
    message: 'Invitation is valid',
    data: {
      email: invite.email,
      role: invite.role
    }
  });
});

// @desc    Accept Invitation and Setup Password
// @route   POST /api/v1/auth/accept-invite
// @access  Public
export const acceptInvite = asyncHandler(async (req, res) => {
  const { token, name, password } = req.body;

  if (!token || !name || !password) {
    return res.status(400).json({ success: false, message: 'Token, name, and password are required' });
  }

  const tokenHash = hashToken(token);
  const invite = await Invite.findOne({ tokenHash, used: false });

  if (!invite) {
    return res.status(400).json({ success: false, message: 'Invalid or expired invitation token' });
  }

  if (invite.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Invitation has expired' });
  }

  // Check if a user with that email already exists (safety check)
  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User with this email already exists' });
  }

  // Create new user (role is taken from the invite)
  // Pre-save hook in User model will handle password hashing with bcryptjs (salt cost 12)
  const user = await User.create({
    name: name.trim(),
    email: invite.email,
    password: password.trim(),
    role: invite.role,
    isActive: true
  });

  // Mark invite as used
  invite.used = true;
  await invite.save();

  // Audit log
  await auditLog({
    userId: user._id,
    action: 'ACCEPT_INVITE',
    entity: 'User',
    entityId: user._id.toString(),
    ip: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: 'Account created successfully. You can now log in.'
  });
});

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
    });
  }

  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user info
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id || req.user._id);
  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, message: 'User not found or inactive' });
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

// @desc    Update password
// @route   PUT /api/v1/auth/update-password
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new password' });
  }

  // Find user and explicitly select password field
  const user = await User.findById(req.user.id || req.user._id).select('+password');
  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, message: 'User not found or inactive' });
  }

  // Check if current password is correct
  const passwordMatch = await user.matchPassword(currentPassword);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Invalid current password' });
  }

  // Update password (pre-save hook will hash it)
  user.password = newPassword;
  await user.save();

  // Audit log
  await auditLog({
    userId: user._id,
    action: 'UPDATE_PASSWORD',
    entity: 'User',
    entityId: user._id.toString(),
    ip: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});
