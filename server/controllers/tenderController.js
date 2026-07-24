import Tender from '../models/Tender.js';
import Counter from '../models/Counter.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import { createNotification } from './notificationController.js';

export const getTenders = asyncHandler(async (req, res) => {
  const tenders = await Tender.find().sort({ createdAt: -1 });
  res.json({ success: true, data: tenders });
});

export const createTender = asyncHandler(async (req, res) => {
  if (!req.body.latrics_tender_id || !req.body.latrics_tender_id.trim()) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'latricsTenderId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    req.body.latrics_tender_id = `LTR-TND-${String(counter.seq).padStart(6, '0')}`;
  }

  if (!req.body.tender_no || !req.body.tender_no.trim()) {
    req.body.tender_no = req.body.tender_id || req.body.latrics_tender_id || 'TND-UNNAMED';
  }

  const tender = await Tender.create(req.body);
  res.status(201).json({ success: true, data: tender });
});

export const importTenders = asyncHandler(async (req, res) => {
  const { tenders } = req.body;
  if (!Array.isArray(tenders) || tenders.length === 0) {
    return res.status(400).json({ success: false, message: 'No tenders provided to import' });
  }

  const createdTenders = [];
  const errors = [];
  const validStatuses = ['New', 'Under Preparation', 'Submitted', 'Evaluation', 'Awarded', 'Won', 'Lost'];
  const validEmd = ['EMD Paid', 'EMD NA', 'EMD Exempted'];
  const validJv = ['JV', 'JV Not Allowed'];

  for (let i = 0; i < tenders.length; i++) {
    const rawTender = tenders[i];
    try {
      const tenderData = { ...rawTender };

      // 1. Latrics Tender ID Sequence
      if (!tenderData.latrics_tender_id || !tenderData.latrics_tender_id.trim()) {
        const counter = await Counter.findByIdAndUpdate(
          { _id: 'latricsTenderId' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        tenderData.latrics_tender_id = `LTR-TND-${String(counter.seq).padStart(6, '0')}`;
      }

      // 2. Tender Number
      if (!tenderData.tender_no || !tenderData.tender_no.trim()) {
        tenderData.tender_no = tenderData.tender_id || tenderData.latrics_tender_id || 'TND-UNNAMED';
      }

      // 3. Authority
      if (!tenderData.authority || !tenderData.authority.trim()) {
        tenderData.authority = 'Unknown Authority';
      }

      // 4. Status normalization
      let rawStatus = String(tenderData.status || '').trim().toLowerCase();
      if (!rawStatus) {
        tenderData.status = 'New';
      } else if (rawStatus === 'new') {
        tenderData.status = 'New';
      } else if (rawStatus.includes('prep')) {
        tenderData.status = 'Under Preparation';
      } else if (rawStatus.startsWith('sub')) {
        tenderData.status = 'Submitted';
      } else if (rawStatus.startsWith('eval')) {
        tenderData.status = 'Evaluation';
      } else if (rawStatus.startsWith('award')) {
        tenderData.status = 'Awarded';
      } else if (rawStatus === 'won') {
        tenderData.status = 'Won';
      } else if (rawStatus === 'lost') {
        tenderData.status = 'Lost';
      } else {
        const matched = validStatuses.find(s => s.toLowerCase() === rawStatus);
        tenderData.status = matched || 'New';
      }

      // 5. EMD Status normalization
      let rawEmd = String(tenderData.emd || '').trim().toLowerCase();
      if (!rawEmd) {
        tenderData.emd = 'EMD Exempted';
      } else if (rawEmd.includes('paid') || rawEmd === 'yes') {
        tenderData.emd = 'EMD Paid';
      } else if (rawEmd.includes('na') || rawEmd.includes('not')) {
        tenderData.emd = 'EMD NA';
      } else if (rawEmd.includes('exempt')) {
        tenderData.emd = 'EMD Exempted';
      } else {
        const matched = validEmd.find(e => e.toLowerCase() === rawEmd);
        tenderData.emd = matched || 'EMD Exempted';
      }

      // 6. JV Status normalization
      let rawJv = String(tenderData.jv || '').trim().toLowerCase();
      if (!rawJv) {
        tenderData.jv = 'JV Not Allowed';
      } else if (rawJv === 'jv' || rawJv.includes('allow') || rawJv === 'yes') {
        tenderData.jv = 'JV';
      } else if (rawJv.includes('not')) {
        tenderData.jv = 'JV Not Allowed';
      } else {
        const matched = validJv.find(j => j.toLowerCase() === rawJv);
        tenderData.jv = matched || 'JV Not Allowed';
      }

      // 7. Amount & EMD Amount parsing
      if (tenderData.amount !== undefined && tenderData.amount !== null) {
        const parsedAmount = Number(String(tenderData.amount).replace(/[^0-9.]/g, ''));
        tenderData.amount = isNaN(parsedAmount) ? 0 : parsedAmount;
      } else {
        tenderData.amount = 0;
      }

      if (tenderData.emd_amount !== undefined && tenderData.emd_amount !== null) {
        const parsedEmdAmount = Number(String(tenderData.emd_amount).replace(/[^0-9.]/g, ''));
        tenderData.emd_amount = isNaN(parsedEmdAmount) ? 0 : parsedEmdAmount;
      } else {
        tenderData.emd_amount = 0;
      }

      // 8. Create tender in MongoDB
      const tender = await Tender.create(tenderData);
      createdTenders.push(tender);
    } catch (err) {
      console.error(`Error importing tender row ${i + 1}:`, err.message);
      errors.push({ row: i + 1, message: err.message });
    }
  }

  res.status(201).json({ 
    success: true, 
    count: createdTenders.length, 
    data: createdTenders,
    errors: errors
  });
});

export const updateTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
  res.json({ success: true, data: tender });
});

export const deleteTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findById(req.params.id);
  if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });

  if (req.user.role === 'manager') {
    await ApprovalRequest.create({
      type: 'Delete',
      raisedBy: req.user.name || req.user.email,
      recordModel: 'Tender',
      recordId: tender._id,
      recordName: tender.tender_no || tender.latrics_tender_id,
      description: `Requested deletion of tender ${tender.tender_no || tender.latrics_tender_id}`
    });
    await createNotification({ 
      message: `Deletion request by ${req.user.name || req.user.email} for tender: ${tender.tender_no || tender.latrics_tender_id}`, 
      type: 'warning', 
      recipientRoles: ['Super Admin', 'Admin'] 
    });
    return res.json({ success: true, message: 'Deletion request submitted for Admin approval', isPending: true });
  }

  await Tender.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: {} });
});

export const deleteMultipleTenders = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ success: false, message: 'Invalid tender IDs provided' });
  }

  if (req.user.role === 'manager') {
    const tenders = await Tender.find({ _id: { $in: ids } });
    const requests = tenders.map(tender => ({
      type: 'Delete',
      raisedBy: req.user.name || req.user.email,
      recordModel: 'Tender',
      recordId: tender._id,
      recordName: tender.tender_no || tender.latrics_tender_id,
      description: `Bulk deletion request for tender ${tender.tender_no || tender.latrics_tender_id}`
    }));
    await ApprovalRequest.insertMany(requests);
    await createNotification({ 
      message: `Bulk deletion request by ${req.user.name || req.user.email} for ${tenders.length} tenders`, 
      type: 'warning', 
      recipientRoles: ['Super Admin', 'Admin'] 
    });
    return res.json({ success: true, message: 'Bulk deletion request submitted for Admin approval', isPending: true });
  }

  await Tender.deleteMany({ _id: { $in: ids } });
  await createNotification({ 
    message: `${ids.length} tenders deleted`, 
    type: 'warning', 
    recipientRoles: ['Super Admin', 'Admin'] 
  });
  
  res.json({ success: true, message: 'Tenders deleted successfully' });
});

export const updateMultipleTenders = asyncHandler(async (req, res) => {
  const { ids, updateData } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of tender IDs to update');
  }

  const bulkOps = ids.map(id => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: updateData }
    }
  }));

  if (bulkOps.length > 0) {
    await Tender.bulkWrite(bulkOps);
  }

  const updatedTenders = await Tender.find({ _id: { $in: ids } });
  
  await createNotification({ 
    message: `${ids.length} tenders bulk updated`, 
    type: 'info', 
    recipientRoles: ['Super Admin', 'Admin'] 
  });

  res.json({ 
    success: true, 
    message: `${ids.length} tenders updated`,
    updatedCount: ids.length,
    data: updatedTenders
  });
});

export const resetTenderCounter = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Not authorized to reset counter' });
  }

  await Counter.findByIdAndUpdate('latricsTenderId', { seq: 0 }, { upsert: true });
  res.json({ success: true, message: 'Tender ID sequence reset to 1' });
});
