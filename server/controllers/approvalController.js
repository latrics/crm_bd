import ApprovalRequest from '../models/ApprovalRequest.js';
import Lead from '../models/Lead.js';
import Tender from '../models/Tender.js';
import Deal from '../models/Deal.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notificationController.js';

export const getApprovals = asyncHandler(async (req, res) => {
  const approvals = await ApprovalRequest.find().sort({ createdAt: -1 });
  res.json({ success: true, data: approvals });
});

export const updateApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const request = await ApprovalRequest.findById(id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  if (status === 'Approved' && request.type === 'Delete') {
    if (request.recordModel === 'Tender') {
      const tender = await Tender.findByIdAndDelete(request.recordId);
      if (tender) {
        await createNotification({
          message: `Tender deleted by admin approval: ${tender.tender_no || tender.latrics_tender_id}`,
          type: 'warning',
          recipientRoles: ['Super Admin', 'Admin']
        });
      }
    } else if (request.recordModel === 'Deal') {
      const deal = await Deal.findById(request.recordId);
      if (deal) {
        await Deal.findByIdAndDelete(request.recordId);
        if (deal.from_lead_id) {
          await Lead.findByIdAndDelete(deal.from_lead_id);
          await Doc.deleteMany({ entity_id: deal.from_lead_id });
        }
        await Lead.findByIdAndDelete(deal._id);
        await Doc.deleteMany({ entity_id: deal._id });
        await createNotification({
          message: `Deal deleted by admin approval: ${deal.title}`,
          type: 'warning',
          recipientUser: deal.owner,
          relatedId: deal._id
        });
      }
    } else {
      // Default to Lead deletion
      const lead = await Lead.findByIdAndDelete(request.recordId);
      if (lead) {
        await Deal.deleteMany({ from_lead_id: request.recordId });
        await Doc.deleteMany({ entity_id: request.recordId });
        await createNotification({
          message: `Lead deleted by admin approval: ${lead.company}`,
          type: 'warning',
          recipientUser: lead.owner,
          relatedId: lead._id
        });
      }
    }
  }

  request.status = status;
  await request.save();

  // Notify the manager who raised it
  await createNotification({ message: `Your ${request.type} request for ${request.recordName} was ${status}`, type: status === 'Approved' ? 'success' : 'warning', recipientUser: request.raisedBy });

  res.json({ success: true, data: request });
});

