import User from '../models/User.js';
import Session from '../models/Session.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide an email and password' });
  }

  // Check for user
  console.log(`Login attempt for: ${email}`);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    console.log(`User not found: ${email}`);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await user.matchPassword(password);
  console.log(`Password match for ${email}: ${isMatch}`);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated' });
  }

  // Create tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store session
  await Session.create({
    user: user._id,
    refreshToken,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  // Update last login
  user.lastLogin = Date.now();
  user.loginHistory.push({
    timestamp: Date.now(),
    ip: req.ip,
    device: req.headers['user-agent']
  });
  await user.save();

  // Send tokens in HTTP-only cookies
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(200).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    }
  });
});

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  // Check if session exists in DB
  const session = await Session.findOne({ refreshToken, isValid: true });
  if (!session) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid' });
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'User not found or inactive' });
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  res.status(200).json({
    success: true,
    accessToken
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    // Invalidate session in DB
    await Session.findOneAndUpdate({ refreshToken }, { isValid: false });
  }

  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user
  });
});
