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
  owner:        { type: String, enum: ['Sivaram B','Sureka Suresh','Rajib Saikia'] },
  industry:     { type: String, enum: ['Mining','Highway & Railways','Urban Development','Energy & Utilities','Water Resources','Emergency Services','DPR'] },
  remarks:      String,
  city:         String,
  state:        String,
  designation:  String,
  bant_b:   { type: Number, default: 0, min: 0, max: 5 },
  bant_a:   { type: Number, default: 0, min: 0, max: 5 },
  bant_n:   { type: Number, default: 0, min: 0, max: 5 },
  bant_t:   { type: Number, default: 0, min: 0, max: 5 },
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);
