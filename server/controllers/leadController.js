import Lead from '../models/Lead.js';
import Deal from '../models/Deal.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

export const getLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find().sort({ createdAt: -1 });
  res.json({ success: true, data: leads });
});

export const createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create(req.body);
  res.status(201).json({ success: true, data: lead });
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: lead });
});

export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: {} });
});

export const convertLead = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status: 'Converted' }, { session, new: true });
    if (!lead) throw new Error('Lead not found');

    const deal = await Deal.create([{
      from_lead_id: lead._id,
      title: `${lead.name} - ${lead.company}`,
      company: lead.company,
      contact: lead.name,
      email: lead.email,
      phone: lead.phone,
      sector: lead.sector,
      source: lead.source,
      notes: lead.notes,
      owner: lead.owner,
      value: lead.value,
      probability: 50,
      stage: 'Negotiation',
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, data: { lead, deal: deal[0] } });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
});
