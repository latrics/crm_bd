import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  leadId:   { type: String, unique: true, sparse: true },
  decisionMaker:{ type: String, trim: true },
  company:      { type: String, required: true, trim: true },
  email:        { type: String, required: true, trim: true, lowercase: true },
  phone:        String,
  status:       { type: String, enum: ['Leads','Communicated','Discussion','Pricing / Quote','Demo','Closure', 'Converted'], default: 'Leads' },
  value:        { type: Number, default: 0 },
  outbound:     { type: String }, // Removed enum to support custom 'Others' sources
  broughtBy:    { type: String },
  owner:        { type: String },
  industry:     { type: String, enum: ['Mining','Highway & Railways','Urban Development','Energy & Utilities','Water Resources','Emergency Services','Others', ''] },
  businessModel: { type: String },
  businessModelDetail: { type: String },
  bio:          String,
  remarks:      String,
  city:         String,
  state:        String,
  designation:  String,
  bant_b:   { type: Number, default: 0, min: 0, max: 5 },
  bant_a:   { type: Number, default: 0, min: 0, max: 5 },
  bant_n:   { type: Number, default: 0, min: 0, max: 5 },
  bant_t:   { type: Number, default: 0, min: 0, max: 5 },
  deadline: { type: Date },
  assignedAt: { type: Date },
  alert24hSent: { type: Boolean, default: false },
  alert1hSent: { type: Boolean, default: false }
}, { timestamps: true });

leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, deadline: 1 });

export default mongoose.model('Lead', leadSchema);
