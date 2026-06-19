import User from '../models/User.js';
import Role from '../models/Role.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.status(200).json({ success: true, count: users.length, data: users });
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

  await user.deleteOne();

  res.status(200).json({ success: true, data: {} });
});
