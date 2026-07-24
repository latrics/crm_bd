import mongoose from 'mongoose';

const approvalRequestSchema = new mongoose.Schema({
  type: { type: String, enum: ['Delete', 'Discount', 'Other'], required: true },
  raisedBy: { type: String, required: true },
  recordModel: { type: String, enum: ['Lead', 'Tender'], default: 'Lead' },
  recordId: { type: mongoose.Schema.Types.ObjectId, refPath: 'recordModel' },
  recordName: { type: String }, // e.g. Company name or Lead ID string
  description: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  metadata: { type: mongoose.Schema.Types.Mixed } // For storing anything extra, like bulk IDs
}, { timestamps: true });

export default mongoose.model('ApprovalRequest', approvalRequestSchema);

