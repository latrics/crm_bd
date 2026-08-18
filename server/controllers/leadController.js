import Lead from '../models/Lead.js';
import Deal from '../models/Deal.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import Counter from '../models/Counter.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import mongoose from 'mongoose';
import Doc from '../models/Doc.js';

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
  
  if (req.body.decisionMaker === undefined || req.body.decisionMaker === null) {
    req.body.decisionMaker = '';
  }

  // Set assignedAt if owner is provided (deadline comes directly from client now)
  if (req.body.owner) {
    req.body.assignedAt = new Date();
  }
  if (req.user) {
    req.body.addedBy = req.user.name || req.user.email;
  }

  const lead = await Lead.create(req.body);
  
  if (lead.addedBy) {
    await createNotification({
      message: `Lead successfully created: ${lead.company} (ID: ${lead.leadId || lead._id}) by ${lead.addedBy || 'System'}`,
      type: 'success',
      category: 'Leads',
      recipientUser: lead.addedBy,
      relatedId: lead._id
    });
  }

  if (lead.owner) {
    await createNotification({
      message: `New lead assigned to you: ${lead.company} (ID: ${lead.leadId || lead._id}) by ${lead.addedBy || 'System'}`,
      type: 'assignment',
      category: 'Leads',
      recipientUser: lead.owner,
      relatedId: lead._id
    });
  }

  res.status(201).json({ success: true, data: lead });
});

export const updateLead = asyncHandler(async (req, res) => {
  const existingLead = await Lead.findById(req.params.id);
  if (!existingLead) return res.status(404).json({ success: false, message: 'Lead not found' });

  // If existing lead is Converted and has a Deal, protect it from being accidentally reverted to 'Leads'
  const dealExists = await Deal.exists({ from_lead_id: req.params.id });
  if (existingLead.status === 'Converted' && dealExists && req.body.status === 'Leads') {
    delete req.body.status; // Preserve 'Converted' status
  }

  const ownerChanged = req.body.owner !== undefined && req.body.owner !== existingLead.owner;
  
  if (ownerChanged) {
    if (req.body.owner) {
      req.body.assignedAt = new Date();
    } else {
      req.body.assignedAt = null;
    }
  }

  // Handle automatic conversion to Deal if status becomes Closure or Converted AND no Deal exists yet
  const shouldConvert = (req.body.status === 'Closure' || req.body.status === 'Converted') && !dealExists;

  let deal = null;
  if (shouldConvert) {
    req.body.status = 'Converted'; // Transition internally to Converted
    try {
      const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      
      deal = await Deal.create({
        _id: lead._id,
        from_lead_id: lead._id,
        dealId: lead.leadId,
        title: `${lead.decisionMaker || 'Lead'} - ${lead.company}`,
        company: lead.company,
        contact: lead.decisionMaker || '',
        designation: lead.designation || '',
        email: lead.email || '',
        phone: lead.phone || '',
        city: lead.city || '',
        state: lead.state || '',
        sector: lead.industry || '',
        source: lead.outbound || '',
        broughtBy: lead.broughtBy || '',
        businessModel: lead.businessModel || '',
        businessModelDetail: lead.businessModelDetail || '',
        notes: [lead.bio ? `Bio: ${lead.bio}` : '', lead.remarks ? `Remarks: ${lead.remarks}` : ''].filter(Boolean).join('\n\n'),
        owner: lead.owner,
        value: lead.value,
        probability: 50,
        stage: 'Negotiation',
        close_date: new Date().toISOString().split('T')[0],
      });
      
      await Doc.updateMany(
        { entity_id: lead._id, entity_type: 'lead' },
        { entity_type: 'deal' }
      );
      
      await createNotification({ message: `Congrats! Lead ${lead.company} (ID: ${lead.leadId || lead._id}) converted to Deal (ID: ${deal.dealId}) by ${req.user ? (req.user.name || req.user.email) : 'System'}.`, type: 'success', category: 'Deals', recipientUser: lead.owner, relatedId: lead._id });
      return res.json({ success: true, data: lead, deal });
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Failed to convert to Deal: ' + error.message });
    }
  }

  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  
  // If a Deal exists for this lead, keep deal fields synchronized
  if (dealExists) {
    const dealUpdate = {};
    if (req.body.company !== undefined) dealUpdate.company = req.body.company;
    if (req.body.decisionMaker !== undefined) dealUpdate.contact = req.body.decisionMaker;
    if (req.body.email !== undefined) dealUpdate.email = req.body.email;
    if (req.body.phone !== undefined) dealUpdate.phone = req.body.phone;
    if (req.body.city !== undefined) dealUpdate.city = req.body.city;
    if (req.body.state !== undefined) dealUpdate.state = req.body.state;
    if (req.body.value !== undefined) dealUpdate.value = req.body.value;
    if (req.body.owner !== undefined) dealUpdate.owner = req.body.owner;
    if (req.body.industry !== undefined) dealUpdate.sector = req.body.industry;
    if (req.body.outbound !== undefined) dealUpdate.source = req.body.outbound;
    if (req.body.broughtBy !== undefined) dealUpdate.broughtBy = req.body.broughtBy;
    if (req.body.businessModel !== undefined) dealUpdate.businessModel = req.body.businessModel;
    if (req.body.businessModelDetail !== undefined) dealUpdate.businessModelDetail = req.body.businessModelDetail;
    if (Object.keys(dealUpdate).length > 0) {
      await Deal.updateOne({ from_lead_id: req.params.id }, { $set: dealUpdate });
    }
  }

  let msg = `Lead updated: ${lead.company}`;
  let type = 'info';
  
  const statusChangedToCommunicatedOrLater = 
    req.body.status !== undefined && 
    req.body.status !== existingLead.status && 
    ['Communicated', 'Discussion', 'Pricing / Quote', 'Demo', 'Closure', 'Converted'].includes(req.body.status);

  const updaterName = req.user ? (req.user.name || req.user.email) : 'System';
  if (statusChangedToCommunicatedOrLater) {
    msg = `Congrats! Task completed successfully within the deadline for lead ${lead.company} (ID: ${lead.leadId || lead._id}) by ${updaterName}.`;
    type = 'success';
    if (lead.owner) {
      await createNotification({ message: msg, type: type, category: 'Leads', recipientUser: lead.owner, relatedId: lead._id });
    }
  } else if (ownerChanged) {
    if (existingLead.owner) {
      await createNotification({
        message: `Lead ${lead.company} (ID: ${lead.leadId || lead._id}) reassigned to ${lead.owner || 'Unassigned'} by ${updaterName}`,
        type: 'info',
        category: 'Leads',
        recipientUser: existingLead.owner,
        relatedId: lead._id
      });
    }
    if (lead.owner) {
      await createNotification({
        message: `Lead ${lead.company} (ID: ${lead.leadId || lead._id}) assigned to you by ${updaterName} (previously owned by ${existingLead.owner || 'Unassigned'})`,
        type: 'assignment',
        category: 'Leads',
        recipientUser: lead.owner,
        relatedId: lead._id
      });
    }
  } else {
    msg = `Lead updated: ${lead.company} (ID: ${lead.leadId || lead._id}) by ${updaterName}`;
    if (lead.owner) {
      await createNotification({ message: msg, type: type, category: 'Leads', recipientUser: lead.owner, relatedId: lead._id });
    }
  }

  // Notify creator if status updated to Communicated or later
  if (statusChangedToCommunicatedOrLater && lead.addedBy && lead.addedBy !== lead.owner) {
    await createNotification({
      message: `Progress Update: Lead ${lead.company} (ID: ${lead.leadId || lead._id}) is now ${lead.status} (added by you, updated by ${updaterName})`,
      type: 'info',
      category: 'Leads',
      recipientUser: lead.addedBy,
      relatedId: lead._id
    });
  }

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
    await createNotification({ message: `Deletion request raised by ${req.user.name || req.user.email} for lead: ${lead.company} (ID: ${lead.leadId || lead._id})`, type: 'warning', category: 'Leads', recipientRoles: ['Super Admin', 'Admin'] });
    return res.json({ success: true, message: 'Deletion request submitted for Admin approval', isPending: true });
  }

  await Lead.findByIdAndDelete(req.params.id);
  await Deal.deleteMany({ from_lead_id: req.params.id });
  await Doc.deleteMany({ entity_id: req.params.id });
  await createNotification({ message: `Lead deleted: ${lead.company} (ID: ${lead.leadId || lead._id}) by ${req.user.name || req.user.email || 'System'}`, type: 'warning', category: 'Leads', recipientUser: lead.owner, relatedId: lead._id });
  
  res.json({ success: true, data: {} });
});

export const deleteMultipleLeads = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ success: false, message: 'Invalid lead IDs provided' });
  }

  if (req.user.role === 'manager') {
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
    await createNotification({ message: `Bulk deletion request raised by ${req.user.name || req.user.email} for ${leads.length} leads (IDs: ${leads.map(l => l.leadId || l._id).join(', ')})`, type: 'warning', category: 'Leads', recipientRoles: ['Super Admin', 'Admin'] });
    return res.json({ success: true, message: 'Bulk deletion request submitted for Admin approval', isPending: true });
  }

  await Lead.deleteMany({ _id: { $in: ids } });
  await Deal.deleteMany({ from_lead_id: { $in: ids } });
  await Doc.deleteMany({ entity_id: { $in: ids } });
  
  await createNotification({ message: `${ids.length} leads deleted by ${req.user.name || req.user.email || 'System'}`, type: 'warning', category: 'Leads', recipientRoles: ['Super Admin', 'Admin'] });
  
  res.json({ success: true, message: 'Leads deleted successfully' });
});

export const convertLead = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status: 'Converted' }, { session, new: true });
    if (!lead) throw new Error('Lead not found');

    const deal = await Deal.create([{
      _id: lead._id,
      from_lead_id: lead._id,
      dealId: lead.leadId,
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
      broughtBy: lead.broughtBy,
      businessModel: lead.businessModel,
      businessModelDetail: lead.businessModelDetail,
      notes: lead.remarks,
      owner: lead.owner,
      value: lead.value,
      probability: 50,
      stage: 'Negotiation',
      close_date: new Date().toISOString().split('T')[0],
    }], { session });

    await Doc.updateMany(
      { entity_id: lead._id, entity_type: 'lead' },
      { entity_type: 'deal' },
      { session }
    );

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

  // Filter out any completely empty items or items missing company
  const validLeads = leads.filter(lead => lead && lead.company && String(lead.company).trim() !== '');
  if (validLeads.length === 0) {
    return res.status(400).json({ success: false, message: 'No leads with valid company names found' });
  }

  const count = validLeads.length;
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'leadId' },
    { $inc: { seq: count } },
    { new: true, upsert: true }
  );

  let startSeq = counter.seq - count + 1;
  const leadsToInsert = validLeads.map(lead => {
    const leadId = `LED-${String(startSeq++).padStart(6, '0')}`;
    const newLead = { 
      ...lead, 
      leadId,
      company: String(lead.company).trim(),
      decisionMaker: lead.decisionMaker !== undefined && lead.decisionMaker !== null ? String(lead.decisionMaker).trim() : '',
      email: lead.email !== undefined && lead.email !== null ? String(lead.email).trim() : '',
      phone: lead.phone !== undefined && lead.phone !== null ? String(lead.phone).trim() : '',
      status: lead.status || 'Leads'
    };
    if (newLead.owner) {
      newLead.assignedAt = new Date();
    }
    if (req.user) {
      newLead.addedBy = req.user.name || req.user.email;
    }
    return newLead;
  });

  const insertedLeads = await Lead.insertMany(leadsToInsert);
  
  await createNotification({ message: `${insertedLeads.length} leads were imported into the system by ${req.user.name || req.user.email}.`, type: 'info', recipientRoles: ['Super Admin', 'Admin'] });

  if (req.user) {
    await createNotification({
      message: `Your import of ${insertedLeads.length} leads was completed successfully.`,
      type: 'success',
      recipientUser: req.user.name || req.user.email
    });
  }

  res.status(201).json({ 
    success: true, 
    data: insertedLeads,
    total: insertedLeads.length,
    leadIdRange: `${leadsToInsert[0].leadId} to ${leadsToInsert[leadsToInsert.length - 1].leadId}`
  });
});

export const cleanupOrphanedLeads = asyncHandler(async (req, res) => {
  const deals = await Deal.find({}).select('_id from_lead_id company dealId title').lean();
  const leads = await Lead.find({}).lean();

  const dealLeadIdSet = new Set(deals.map(d => String(d.from_lead_id || d._id)));
  
  let resyncedCount = 0;
  let orphanedConvertedCount = 0;
  const fixedLeadIds = [];

  for (const lead of leads) {
    const isLinkedToDeal = dealLeadIdSet.has(String(lead._id));

    if (isLinkedToDeal && lead.status !== 'Converted') {
      // Re-sync status to Converted because it has an active deal
      await Lead.findByIdAndUpdate(lead._id, { status: 'Converted' });
      resyncedCount++;
      fixedLeadIds.push(lead.leadId || lead._id);
    } else if (!isLinkedToDeal && lead.status === 'Converted') {
      // It's marked as Converted, but no Deal exists in the database
      // If action is requested, we can revert status to 'Leads' so it becomes visible and manageable
      await Lead.findByIdAndUpdate(lead._id, { status: 'Leads' });
      orphanedConvertedCount++;
      fixedLeadIds.push(lead.leadId || lead._id);
    }
  }

  res.json({
    success: true,
    message: `Cleanup completed. Resynced ${resyncedCount} active deals to Converted status, and restored ${orphanedConvertedCount} orphaned converted leads back to Leads status.`,
    resyncedCount,
    orphanedConvertedCount,
    fixedLeadIds
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

  const statusChangedToClosureOrConverted = 
    updateData.status !== undefined && 
    ['Closure', 'Converted'].includes(updateData.status);

  if (statusChangedToClosureOrConverted) {
    updateData.status = 'Converted';
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

  if (statusChangedToClosureOrConverted) {
    const existingDeals = await Deal.find({ from_lead_id: { $in: ids } }).select('from_lead_id').lean();
    const existingDealLeadIds = new Set(existingDeals.map(d => String(d.from_lead_id)));
    
    const dealsToCreate = [];
    for (const lead of updatedLeads) {
      if (!existingDealLeadIds.has(String(lead._id))) {
        dealsToCreate.push({
          _id: lead._id,
          from_lead_id: lead._id,
          dealId: lead.leadId,
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
          broughtBy: lead.broughtBy,
          businessModel: lead.businessModel,
          businessModelDetail: lead.businessModelDetail,
          notes: [lead.bio ? `Bio: ${lead.bio}` : '', lead.remarks ? `Remarks: ${lead.remarks}` : ''].filter(Boolean).join('\n\n'),
          owner: lead.owner,
          value: lead.value,
          probability: 50,
          stage: 'Negotiation',
          close_date: new Date().toISOString().split('T')[0],
        });
      }
    }
    
    if (dealsToCreate.length > 0) {
      await Deal.insertMany(dealsToCreate);
      
      const newDealIds = dealsToCreate.map(d => d._id);
      await Doc.updateMany(
        { entity_id: { $in: newDealIds }, entity_type: 'lead' },
        { entity_type: 'deal' }
      );

      for (const deal of dealsToCreate) {
        if (deal.owner) {
          await createNotification({ 
            message: `Congrats! Lead ${deal.company} (ID: ${deal.leadId || deal.from_lead_id}) converted to Deal (ID: ${deal.dealId || deal._id}) by ${req.user ? (req.user.name || req.user.email) : 'System'}.`, 
            type: 'success', 
            category: 'Deals',
            recipientUser: deal.owner, 
            relatedId: deal.from_lead_id 
          });
        }
      }
    }
  }
  
  const updaterName = req.user ? (req.user.name || req.user.email) : 'System';
  let msg = `${leads.length} leads bulk updated`;
  let type = 'info';
  
  const statusChangedToCommunicatedOrLater = 
    updateData.status !== undefined && 
    ['Communicated', 'Discussion', 'Pricing / Quote', 'Demo', 'Closure', 'Converted'].includes(updateData.status);

  if (statusChangedToCommunicatedOrLater) {
    const leadsByOwner = leads.reduce((acc, lead) => {
      if (lead.owner) {
        acc[lead.owner] = (acc[lead.owner] || 0) + 1;
      }
      return acc;
    }, {});

    for (const [owner, count] of Object.entries(leadsByOwner)) {
      await createNotification({
        message: `Congrats! Tasks completed successfully within the deadline for ${count} of your leads by ${updaterName}.`,
        type: 'success',
        category: 'Leads',
        recipientUser: owner
      });
    }
  } else if (updateData.owner) {
    for (const lead of leads) {
      if (lead.owner && lead.owner !== updateData.owner) {
        await createNotification({
          message: `Lead ${lead.company} (ID: ${lead.leadId || lead._id}) reassigned to ${updateData.owner} by ${updaterName}`,
          type: 'info',
          category: 'Leads',
          recipientUser: lead.owner,
          relatedId: lead._id
        });
      }
    }
    await createNotification({
      message: `${leads.length} leads assigned to you by ${updaterName}`,
      type: 'assignment',
      category: 'Leads',
      recipientUser: updateData.owner
    });
  } else {
    if (req.user) {
      await createNotification({
        message: `${leads.length} leads successfully bulk updated by ${updaterName}. (IDs: ${leads.map(l => l.leadId || l._id).join(', ')})`,
        type: 'info',
        category: 'Leads',
        recipientUser: updaterName
      });
    }
  }

  res.json({ 
    success: true, 
    message: `${leads.length} leads updated`,
    updatedCount: leads.length,
    data: updatedLeads
  });
});
