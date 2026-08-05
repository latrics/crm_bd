import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  from_lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  dealId:       { type: String, unique: true, sparse: true },
  title:        { type: String, required: true, trim: true },
  company:      String,
  contact:      String,
  designation:  String,
  email:        String,
  phone:        String,
  city:         String,
  state:        String,
  stage:        { type: String, enum: ['Negotiation','Won','Lost'], default: 'Negotiation' },
  value:        { type: Number, default: 0 },
  probability:  { type: Number, default: 30, min: 0, max: 100 },
  close_date:   String,
  alert7dSent:  { type: Boolean, default: false },
  alert24hSent: { type: Boolean, default: false },
  owner:        { type: String },
  addedBy:      String,
  sector:       String,
  source:       String,
  broughtBy:    String,
  businessModel: { type: String },
  businessModelDetail: { type: String },
  notes:        String,
}, { timestamps: true });

dealSchema.index({ createdAt: -1 });

export default mongoose.model('Deal', dealSchema);

