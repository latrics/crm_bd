import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for failed login / public actions
  },
  user_name: {
    type: String,
    default: 'System',
  },
  user_role: {
    type: String,
    default: 'System',
  },
  action: {
    type: String,
    required: true,
  },
  entity: {
    type: String,
    required: true,
  },
  entity_id: {
    type: String,
    default: null,
  },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'success', 'info'],
    default: 'info',
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

