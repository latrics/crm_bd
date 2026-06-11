import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  from_lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  title:        { type: String, required: true, trim: true },
  company:      String,
  contact:      String,
  email:        String,
  phone:        String,
  stage:        { type: String, enum: ['Negotiation','Won','Lost'], default: 'Negotiation' },
  value:        { type: Number, default: 0 },
  probability:  { type: Number, default: 30, min: 0, max: 100 },
  close_date:   String,
  owner:        { type: String, enum: ['Sivaram B','Sureka Suresh','Rajib Saikia'] },
  sector:       String,
  source:       String,
  notes:        String,
}, { timestamps: true });

export default mongoose.model('Deal', dealSchema);
