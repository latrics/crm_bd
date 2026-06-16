import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  entity: {
    type: String,
    default: null,
  },
  entity_id: {
    type: String,
    default: null,
  },
  ip_address: {
    type: String,
    default: null,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('AuditLog', AuditLogSchema);
