import Doc from '../models/Doc.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDocs = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.entity_id) query.entity_id = req.query.entity_id;
  if (req.query.entity_type) query.entity_type = req.query.entity_type;

  const docs = await Doc.find(query).sort({ createdAt: -1 });
  res.json({ success: true, data: docs });
});

export const createDoc = asyncHandler(async (req, res) => {
  const doc = await Doc.create(req.body);
  res.status(201).json({ success: true, data: doc });
});

export const deleteDoc = asyncHandler(async (req, res) => {
  const doc = await Doc.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Doc not found' });
  res.json({ success: true, data: {} });
});
