import Tender from '../models/Tender.js';
import Counter from '../models/Counter.js';
import asyncHandler from '../utils/asyncHandler.js';

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
  for (let tenderData of tenders) {
    if (!tenderData.latrics_tender_id || !tenderData.latrics_tender_id.trim()) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'latricsTenderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      tenderData.latrics_tender_id = `LTR-TND-${String(counter.seq).padStart(6, '0')}`;
    }
    if (!tenderData.tender_no || !tenderData.tender_no.trim()) {
      tenderData.tender_no = tenderData.tender_id || tenderData.latrics_tender_id || 'TND-UNNAMED';
    }
    if (!tenderData.authority || !tenderData.authority.trim()) {
      tenderData.authority = 'Unknown Authority';
    }
    const tender = await Tender.create(tenderData);
    createdTenders.push(tender);
  }

  res.status(201).json({ success: true, count: createdTenders.length, data: createdTenders });
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
