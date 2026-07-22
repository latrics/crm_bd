import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  from_lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
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
  owner:        { type: String },
  sector:       String,
  source:       String,
  businessModel: { type: String },
  businessModelDetail: { type: String },
  notes:        String,
}, { timestamps: true });

export default mongoose.model('Deal', dealSchema);

