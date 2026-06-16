import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
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
  is_revoked: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('RefreshToken', RefreshTokenSchema);
