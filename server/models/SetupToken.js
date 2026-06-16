import mongoose from 'mongoose';

const SetupTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token_hash: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  is_used: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('SetupToken', SetupTokenSchema);
