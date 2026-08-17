import Deal from '../models/Deal.js';
import Lead from '../models/Lead.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import Doc from '../models/Doc.js';
import Counter from '../models/Counter.js';
import { createNotification } from './notificationController.js';
import ApprovalRequest from '../models/ApprovalRequest.js';

export const getDeals = asyncHandler(async (req, res) => {
  const deals = await Deal.find().sort({ createdAt: -1 });
  res.json({ success: true, data: deals });
});

export const createDeal = asyncHandler(async (req, res) => {
  if (req.user) {
    req.body.addedBy = req.user.name || req.user.email;
  }
  if (req.body.stage === 'Won') {
    req.body.probability = 100;
  } else if (req.body.stage === 'Lost') {
    req.body.probability = 0;
  }

  // Directly created deals generate dealId from the leadId sequence
  if (!req.body.dealId) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'leadId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    req.body.dealId = `LED-${String(counter.seq).padStart(6, '0')}`;
  }

  // Create a corresponding Lead in 'Converted' status so dashboard metrics (Leads Added, Conversion Rate, etc.) sync
  const leadIdObj = new mongoose.Types.ObjectId();
  await Lead.create({
    _id: leadIdObj,
    leadId: req.body.dealId,
    company: req.body.company || req.body.title || 'Direct Deal Lead',
    decisionMaker: req.body.contact || req.body.title || 'Direct Deal Contact',
    email: req.body.email || `no-email-${req.body.dealId.toLowerCase()}@example.com`,
    phone: req.body.phone,
    city: req.body.city,
    state: req.body.state,
    designation: req.body.designation,
    status: 'Converted',
    value: req.body.value || 0,
    owner: req.body.owner,
    addedBy: req.body.addedBy,
    industry: req.body.sector,
    outbound: req.body.source,
    broughtBy: req.body.broughtBy,
    businessModel: req.body.businessModel,
    businessModelDetail: req.body.businessModelDetail,
    remarks: req.body.notes
  });

  req.body._id = leadIdObj;
  req.body.from_lead_id = leadIdObj;

  const deal = await Deal.create(req.body);

  if (deal.addedBy) {
    await createNotification({
      message: `Deal successfully created: ${deal.title} (ID: ${deal.dealId || deal._id}) by ${deal.addedBy || 'System'}`,
      type: 'success',
      category: 'Deals',
      recipientUser: deal.addedBy,
      relatedId: deal._id
    });
  }

  if (deal.owner) {
    await createNotification({
      message: `New deal assigned to you: ${deal.title} (ID: ${deal.dealId || deal._id}) by ${deal.addedBy || 'System'}`,
      type: 'assignment',
      category: 'Deals',
      recipientUser: deal.owner,
      relatedId: deal._id
    });
  }

  res.status(201).json({ success: true, data: deal });
});

export const updateDeal = asyncHandler(async (req, res) => {
  const existingDeal = await Deal.findById(req.params.id);
  if (!existingDeal) return res.status(404).json({ success: false, message: 'Deal not found' });

  if (req.body.stage === 'Won') {
    req.body.probability = 100;
  } else if (req.body.stage === 'Lost') {
    req.body.probability = 0;
  }

  const ownerChanged = req.body.owner !== undefined && req.body.owner !== existingDeal.owner;
  const stageChanged = req.body.stage !== undefined && req.body.stage !== existingDeal.stage;

  const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  
  if (deal.from_lead_id) {
    const leadUpdate = {};
    if (req.body.owner !== undefined) leadUpdate.owner = req.body.owner;
    if (req.body.company !== undefined) leadUpdate.company = req.body.company;
    if (req.body.contact !== undefined) leadUpdate.decisionMaker = req.body.contact;
    if (req.body.email !== undefined) leadUpdate.email = req.body.email;
    if (req.body.phone !== undefined) leadUpdate.phone = req.body.phone;
    if (req.body.city !== undefined) leadUpdate.city = req.body.city;
    if (req.body.state !== undefined) leadUpdate.state = req.body.state;
    if (req.body.value !== undefined) leadUpdate.value = req.body.value;
    if (req.body.sector !== undefined) leadUpdate.industry = req.body.sector;
    if (req.body.source !== undefined) leadUpdate.outbound = req.body.source;
    if (req.body.broughtBy !== undefined) leadUpdate.broughtBy = req.body.broughtBy;
    if (req.body.businessModel !== undefined) leadUpdate.businessModel = req.body.businessModel;
    if (req.body.businessModelDetail !== undefined) leadUpdate.businessModelDetail = req.body.businessModelDetail;
    if (req.body.notes !== undefined) leadUpdate.remarks = req.body.notes;

    if (Object.keys(leadUpdate).length > 0) {
      await Lead.findByIdAndUpdate(deal.from_lead_id, leadUpdate);
    }
  }
  
  const updaterName = req.user ? (req.user.name || req.user.email) : 'System';
  if (ownerChanged) {
    if (existingDeal.owner) {
      await createNotification({
        message: `Deal ${deal.title} (ID: ${deal.dealId || deal._id}) reassigned to ${deal.owner || 'Unassigned'} by ${updaterName}`,
        type: 'info',
        category: 'Deals',
        recipientUser: existingDeal.owner,
        relatedId: deal._id
      });
    }
    if (deal.owner) {
      await createNotification({
        message: `Deal ${deal.title} (ID: ${deal.dealId || deal._id}) assigned to you by ${updaterName} (previously owned by ${existingDeal.owner || 'Unassigned'})`,
        type: 'assignment',
        category: 'Deals',
        recipientUser: deal.owner,
        relatedId: deal._id
      });
    }
  } else if (stageChanged) {
    if (deal.stage === 'Won') {
      if (deal.owner) {
        await createNotification({
          message: `Congrats! Deal ${deal.title} (ID: ${deal.dealId || deal._id}) was WON by you! Value: ₹${deal.value || 0}. Marked by ${updaterName}.`,
          type: 'success',
          category: 'Deals',
          recipientUser: deal.owner,
          relatedId: deal._id
        });
      }
      await createNotification({
        message: `Victory! Deal ${deal.title} (ID: ${deal.dealId || deal._id}) was WON by ${deal.owner || 'Unassigned'}! Value: ₹${deal.value || 0}. Marked by ${updaterName}.`,
        type: 'success',
        category: 'Deals',
        recipientRoles: ['Super Admin', 'Admin']
      });
    } else if (deal.stage === 'Lost') {
      if (deal.owner) {
        await createNotification({
          message: `Deal ${deal.title} (ID: ${deal.dealId || deal._id}) marked as Lost by ${updaterName}.`,
          type: 'warning',
          category: 'Deals',
          recipientUser: deal.owner,
          relatedId: deal._id
        });
      }
    } else {
      if (deal.owner) {
        await createNotification({
          message: `Deal ${deal.title} (ID: ${deal.dealId || deal._id}) updated to stage ${deal.stage} by ${updaterName}`,
          type: 'info',
          category: 'Deals',
          recipientUser: deal.owner,
          relatedId: deal._id
        });
      }
    }
  } else {
    if (deal.owner) {
      await createNotification({
        message: `Deal updated: ${deal.title} (ID: ${deal.dealId || deal._id}) by ${updaterName}`,
        type: 'info',
        category: 'Deals',
        recipientUser: deal.owner,
        relatedId: deal._id
      });
    }
  }

  res.json({ success: true, data: deal });
});

export const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });

  if (req.user.role === 'manager') {
    await ApprovalRequest.create({
      type: 'Delete',
      raisedBy: req.user.name || req.user.email,
      recordModel: 'Deal',
      recordId: deal._id,
      recordName: deal.title || deal.dealId,
      description: `Requested deletion of deal ${deal.title}`
    });
    await createNotification({ message: `Deletion request raised by ${req.user.name || req.user.email} for deal: ${deal.title} (ID: ${deal.dealId || deal._id})`, type: 'warning', category: 'Deals', recipientRoles: ['Super Admin', 'Admin'] });
    return res.json({ success: true, message: 'Deletion request submitted for Admin approval', isPending: true });
  }

  await Deal.findByIdAndDelete(req.params.id);

  if (deal.from_lead_id) {
    await Lead.findByIdAndDelete(deal.from_lead_id);
  }

  if (deal.owner) {
    await createNotification({
      message: `Deal deleted: ${deal.title} (ID: ${deal.dealId || deal._id}) by ${req.user ? (req.user.name || req.user.email) : 'System'}`,
      type: 'warning',
      category: 'Deals',
      recipientUser: deal.owner
    });
  }

  res.json({ success: true, data: {} });
});

export const revertDeal = asyncHandler(async (req, res) => {
  const { targetStage } = req.body;
  
  if (!targetStage) {
    return res.status(400).json({ success: false, message: 'targetStage is required to revert a deal' });
  }

  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });

    if (deal.from_lead_id) {
      await Lead.findByIdAndUpdate(deal.from_lead_id, { status: targetStage });
    }

    await Deal.findByIdAndDelete(req.params.id);

    await Doc.updateMany(
      { entity_id: deal._id, entity_type: 'deal' },
      { entity_type: 'lead' }
    );

    if (deal.owner) {
      await createNotification({
        message: `Deal ${deal.title} (ID: ${deal.dealId || deal._id}) has been reverted back to a Lead in stage ${targetStage} by ${req.user ? (req.user.name || req.user.email) : 'System'}.`,
        type: 'info',
        category: 'Leads',
        recipientUser: deal.owner
      });
    }

    res.json({ success: true, data: { dealId: req.params.id, targetStage, leadId: deal.from_lead_id } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
