import Lead from '../models/Lead.js';
import Deal from '../models/Deal.js';
import asyncHandler from '../utils/asyncHandler.js';
import Counter from '../models/Counter.js';
import mongoose from 'mongoose';

export const getLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find().sort({ createdAt: -1 });
  res.json({ success: true, data: leads });
});

export const createLead = asyncHandler(async (req, res) => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'leadId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  req.body.leadId = `LED-${String(counter.seq).padStart(6, '0')}`;
  
  const dmLower = req.body.decisionMaker ? req.body.decisionMaker.toLowerCase() : '';
  if (!req.body.decisionMaker || ['na', 'n/a', 'not available', '-'].includes(dmLower)) {
    req.body.decisionMaker = req.body.company || '';
  }

  const lead = await Lead.create(req.body);
  res.status(201).json({ success: true, data: lead });
});

export const updateLead = asyncHandler(async (req, res) => {
  const dmLower = req.body.decisionMaker ? req.body.decisionMaker.toLowerCase() : '';
  if (req.body.hasOwnProperty('decisionMaker') || req.body.company) {
    if (!req.body.decisionMaker || ['na', 'n/a', 'not available', '-'].includes(dmLower)) {
      // If company isn't in body, we might need to fetch the lead to get the company, but for simplicity:
      if (req.body.company) {
        req.body.decisionMaker = req.body.company;
      } else {
        const existingLead = await Lead.findById(req.params.id);
        req.body.decisionMaker = existingLead?.company || '';
      }
    }
  }

  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: lead });
});

export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: {} });
});

export const deleteMultipleLeads = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ success: false, message: 'Invalid lead IDs provided' });
  }
  await Lead.deleteMany({ _id: { $in: ids } });
  res.json({ success: true, message: 'Leads deleted successfully' });
});

export const convertLead = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status: 'Converted' }, { session, new: true });
    if (!lead) throw new Error('Lead not found');

    const deal = await Deal.create([{
      from_lead_id: lead._id,
      title: `${lead.decisionMaker || 'Lead'} - ${lead.company}`,
      company: lead.company,
      contact: lead.decisionMaker,
      email: lead.email,
      phone: lead.phone,
      sector: lead.industry,
      source: lead.outbound,
      notes: lead.remarks,
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

export const importLeads = asyncHandler(async (req, res) => {
  const { leads } = req.body;
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid leads provided' });
  }

  const count = leads.length;
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'leadId' },
    { $inc: { seq: count } },
    { new: true, upsert: true }
  );

  let startSeq = counter.seq - count + 1;
  const leadsToInsert = leads.map(lead => {
    const leadId = `LED-${String(startSeq++).padStart(6, '0')}`;
    return { ...lead, leadId };
  });

  const insertedLeads = await Lead.insertMany(leadsToInsert);

  res.status(201).json({ 
    success: true, 
    data: insertedLeads,
    total: insertedLeads.length,
    leadIdRange: `${leadsToInsert[0].leadId} to ${leadsToInsert[leadsToInsert.length - 1].leadId}`
  });
});

export const resetCounter = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Not authorized to reset counter' });
  }

  await Counter.findByIdAndUpdate('leadId', { seq: 0 }, { upsert: true });
  res.json({ success: true, message: 'Lead ID sequence reset to 1' });
});

// @desc    Update multiple leads
// @route   POST /api/leads/bulk-update
// @access  Private
export const updateMultipleLeads = asyncHandler(async (req, res) => {
  const { ids, updateData } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of lead IDs to update');
  }

  // Find all to get old state for history/audit if needed, or just update directly
  // Using updateMany for efficiency
  const result = await Lead.updateMany(
    { _id: { $in: ids } },
    { $set: updateData },
    { runValidators: true }
  );

  res.json({ 
    success: true, 
    message: `${result.modifiedCount} leads updated`,
    updatedCount: result.modifiedCount 
  });
});
