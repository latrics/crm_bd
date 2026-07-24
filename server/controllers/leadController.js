import Lead from '../models/Lead.js';
import Deal from '../models/Deal.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import Counter from '../models/Counter.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import mongoose from 'mongoose';

import { createNotification } from './notificationController.js';

export const getLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find().sort({ leadId: -1, createdAt: -1 });
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

  // Set assignedAt if owner is provided (deadline comes directly from client now)
  if (req.body.owner) {
    req.body.assignedAt = new Date();
  }

  const lead = await Lead.create(req.body);
  
  await createNotification({
    message: `New lead assigned to you: ${lead.company}`,
    type: 'info',
    recipientUser: lead.owner,
    relatedId: lead._id
  });

  res.status(201).json({ success: true, data: lead });
});

export const updateLead = asyncHandler(async (req, res) => {
  const existingLead = await Lead.findById(req.params.id);
  if (!existingLead) return res.status(404).json({ success: false, message: 'Lead not found' });

  const dmLower = req.body.decisionMaker ? req.body.decisionMaker.toLowerCase() : '';
  if (req.body.hasOwnProperty('decisionMaker') || req.body.company) {
    if (!req.body.decisionMaker || ['na', 'n/a', 'not available', '-'].includes(dmLower)) {
      if (req.body.company) {
        req.body.decisionMaker = req.body.company;
      } else {
        req.body.decisionMaker = existingLead?.company || '';
      }
    }
  }

  const ownerChanged = req.body.owner !== undefined && req.body.owner !== existingLead.owner;
  
  if (ownerChanged) {
    if (req.body.owner) {
      req.body.assignedAt = new Date();
    } else {
      req.body.assignedAt = null;
    }
  }

  // Handle automatic conversion to Deal if status becomes Closure
  let deal = null;
  if (req.body.status === 'Closure' && existingLead.status !== 'Closure' && existingLead.status !== 'Converted') {
    req.body.status = 'Converted'; // Transition internally to Converted
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, session });
      
      const deals = await Deal.create([{
        from_lead_id: lead._id,
        title: `${lead.decisionMaker || 'Lead'} - ${lead.company}`,
        company: lead.company,
        contact: lead.decisionMaker,
        designation: lead.designation,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        state: lead.state,
        sector: lead.industry,
        source: lead.outbound,
        businessModel: lead.businessModel,
        businessModelDetail: lead.businessModelDetail,
        notes: [lead.bio ? `Bio: ${lead.bio}` : '', lead.remarks ? `Remarks: ${lead.remarks}` : ''].filter(Boolean).join('\n\n'),
        owner: lead.owner,
        value: lead.value,
        probability: 50,
        stage: 'Negotiation',
      }], { session });
      
      deal = deals[0];
      await session.commitTransaction();
      session.endSession();
      
      await createNotification({ message: `Congrats! Lead ${lead.company} converted to Deal.`, type: 'success', recipientUser: lead.owner, relatedId: lead._id });
      return res.json({ success: true, data: lead, deal });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Failed to convert to Deal: ' + error.message });
    }
  }

  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  
  let msg = `Lead updated: ${lead.company}`;
  let type = 'info';
  
  if (ownerChanged) {
    msg = `Lead ${lead.company} assigned to ${lead.owner}`;
    type = 'assignment';
  }
  
  await createNotification({ message: msg, type: type, recipientUser: lead.owner, relatedId: lead._id });

  res.json({ success: true, data: lead });
});

export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  
  if (req.user.role === 'manager') {
    await ApprovalRequest.create({
      type: 'Delete',
      raisedBy: req.user.name || req.user.email,
      recordModel: 'Lead',
      recordId: lead._id,
      recordName: lead.company || lead.leadId,
      description: `Requested deletion of lead ${lead.company}`
    });
    await createNotification({ message: `Deletion request by ${req.user.name || req.user.email} for lead: ${lead.company}`, type: 'warning', recipientRoles: ['Super Admin', 'Admin'] });
    return res.json({ success: true, message: 'Deletion request submitted for Admin approval', isPending: true });
  }

  await Lead.findByIdAndDelete(req.params.id);
  await createNotification({ message: `Lead deleted: ${lead.company}`, type: 'warning', recipientUser: lead.owner, relatedId: lead._id });
  
  res.json({ success: true, data: {} });
});

export const deleteMultipleLeads = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ success: false, message: 'Invalid lead IDs provided' });
  }

  if (req.user.role === 'manager') {
    // For bulk delete, we can create one request per lead or one bulk request.
    // Given the schema, one per lead is easier for admins to review individually.
    const leads = await Lead.find({ _id: { $in: ids } });
    const requests = leads.map(lead => ({
      type: 'Delete',
      raisedBy: req.user.name || req.user.email,
      recordModel: 'Lead',
      recordId: lead._id,
      recordName: lead.company || lead.leadId,
      description: `Bulk deletion request for lead ${lead.company}`
    }));
    await ApprovalRequest.insertMany(requests);
    await createNotification({ message: `Bulk deletion request by ${req.user.name || req.user.email} for ${leads.length} leads`, type: 'warning', recipientRoles: ['Super Admin', 'Admin'] });
    return res.json({ success: true, message: 'Bulk deletion request submitted for Admin approval', isPending: true });
  }

  const result = await Lead.deleteMany({ _id: { $in: ids } });
  
  await createNotification({ message: `${ids.length} leads deleted`, type: 'warning', recipientRoles: ['Super Admin', 'Admin'] });
  
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
      designation: lead.designation,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      state: lead.state,
      sector: lead.industry,
      source: lead.outbound,
      businessModel: lead.businessModel,
      businessModelDetail: lead.businessModelDetail,
      notes: lead.remarks,
      owner: lead.owner,
      value: lead.value,
      probability: 50,
      stage: 'Negotiation',
    }], { session });

    await session.commitTransaction();
    session.endSession();
    
    await createNotification({ message: `Congrats! Lead ${lead.company} converted to Deal.`, type: 'success', recipientUser: lead.owner, relatedId: lead._id });

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
    const newLead = { ...lead, leadId };
    if (newLead.owner) {
      newLead.assignedAt = new Date();
    }
    return newLead;
  });

  const insertedLeads = await Lead.insertMany(leadsToInsert);
  
  await createNotification({ message: `${insertedLeads.length} leads were imported into the system by ${req.user.name || req.user.email}.`, type: 'info', recipientRoles: ['Super Admin', 'Admin'] });

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

export const updateMultipleLeads = asyncHandler(async (req, res) => {
  const { ids, updateData } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of lead IDs to update');
  }

  const leads = await Lead.find({ _id: { $in: ids } });
  
  const bulkOps = leads.map(lead => {
    const localUpdate = { ...updateData };
    
    const ownerChanged = localUpdate.owner !== undefined && localUpdate.owner !== lead.owner;
    
    if (ownerChanged) {
      if (localUpdate.owner) {
        localUpdate.assignedAt = new Date();
      } else {
        localUpdate.assignedAt = null;
      }
    }
    
    return {
      updateOne: {
        filter: { _id: lead._id },
        update: { $set: localUpdate }
      }
    };
  });

  if (bulkOps.length > 0) {
    await Lead.bulkWrite(bulkOps);
  }

  const updatedLeads = await Lead.find({ _id: { $in: ids } });
  
  let msg = `${leads.length} leads bulk updated`;
  let type = 'info';
  if (updateData.owner) {
    msg = `${leads.length} leads assigned to ${updateData.owner}`;
    type = 'assignment';
  }
  
  await createNotification({ message: msg, type: type, recipientUser: updateData.owner || null });

  res.json({ 
    success: true, 
    message: `${leads.length} leads updated`,
    updatedCount: leads.length,
    data: updatedLeads
  });
});
