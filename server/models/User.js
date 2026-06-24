import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  clerkId: {
    type: String,
    default: null
  },
  company: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },

  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'member'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
