import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  company:  { type: String, required: true, trim: true },
  email:    { type: String, trim: true, lowercase: true },
  phone:    String,
  status:   { type: String, enum: ['Leads','Communicated','Discussion','Pricing / Quote','Demo','Closure', 'Converted'], default: 'Leads' },
  value:    { type: Number, default: 0 },
  source:   { type: String, enum: ['LinkedIn','Referral','Website','Cold Email','Events'] },
  owner:    { type: String, enum: ['Sivaram B','Sureka Suresh','Rajib Saikia'] },
  sector:   { type: String, enum: ['Mining','Highway & Railways','Urban Development','Energy & Utilities','Water Resources','Emergency Services'] },
  notes:    String,
  bant_b:   { type: Number, default: 0, min: 0, max: 5 },
  bant_a:   { type: Number, default: 0, min: 0, max: 5 },
  bant_n:   { type: Number, default: 0, min: 0, max: 5 },
  bant_t:   { type: Number, default: 0, min: 0, max: 5 },
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);
