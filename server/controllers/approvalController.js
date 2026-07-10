import ApprovalRequest from '../models/ApprovalRequest.js';
import Lead from '../models/Lead.js';
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
    // Actually delete the lead
    const lead = await Lead.findByIdAndDelete(request.recordId);
    if (lead) {
      await createNotification(`Lead deleted by admin approval: ${lead.company}`, 'warning', lead.owner, lead._id);
    }
  }

  request.status = status;
  await request.save();

  // Notify the manager who raised it
  await createNotification(`Your deletion request for ${request.recordName} was ${status}`, status === 'Approved' ? 'success' : 'warning', request.raisedBy, null);

  res.json({ success: true, data: request });
});
