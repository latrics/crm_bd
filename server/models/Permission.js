import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  module: {
    type: String,
    required: true
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Permission', permissionSchema);
