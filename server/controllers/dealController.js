import Deal from '../models/Deal.js';
import Lead from '../models/Lead.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

export const getDeals = asyncHandler(async (req, res) => {
  const deals = await Deal.find().sort({ createdAt: -1 });
  res.json({ success: true, data: deals });
});

export const createDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.create(req.body);
  res.status(201).json({ success: true, data: deal });
});

export const updateDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
  res.json({ success: true, data: deal });
});

export const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findByIdAndDelete(req.params.id);
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
  res.json({ success: true, data: {} });
});

export const revertDeal = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deal = await Deal.findById(req.params.id).session(session);
    if (!deal) throw new Error('Deal not found');

    if (deal.from_lead_id) {
      await Lead.findByIdAndUpdate(deal.from_lead_id, { status: 'Closure' }, { session });
    }

    await Deal.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, data: { dealId: req.params.id } });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
});
