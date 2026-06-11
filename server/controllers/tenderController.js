import Tender from '../models/Tender.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getTenders = asyncHandler(async (req, res) => {
  const tenders = await Tender.find().sort({ createdAt: -1 });
  res.json({ success: true, data: tenders });
});

export const createTender = asyncHandler(async (req, res) => {
  const tender = await Tender.create(req.body);
  res.status(201).json({ success: true, data: tender });
});

export const updateTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
  res.json({ success: true, data: tender });
});

export const deleteTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByIdAndDelete(req.params.id);
  if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
  res.json({ success: true, data: {} });
});
