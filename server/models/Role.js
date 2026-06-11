import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['employee', 'manager', 'admin', 'super_admin']
  },
  displayName: String,
  description: String,
  permissions: [{
    type: String // We'll store the permission keys here for easier lookup
  }],
  hierarchy: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Role', roleSchema);
