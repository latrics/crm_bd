import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'urgent', 'success', 'assignment', 'assigned'], default: 'info' },
  recipientRole: { type: [String] }, // E.g., ['Super Admin', 'Admin']
  recipientUser: { type: String }, // Specific user (e.g., owner's name/ID)
  relatedId: { type: String }, // Lead ID or similar
  readBy: { type: [String], default: [] } // Array of usernames who have read this
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
