import mongoose from 'mongoose';

const tenderSchema = new mongoose.Schema({
  tender_no:        { type: String, required: true, unique: true, trim: true },
  authority:        { type: String, required: true, trim: true },
  description:      String,
  location:         String,
  opening_date:     String,
  closing_date:     String,
  amount:           { type: Number, default: 0 },
  emd:              { type: String, enum: ['EMD Paid','EMD NA','EMD Exempted'] },
  emd_amount:       { type: Number, default: 0 },
  jv:               { type: String, enum: ['JV','JV Not Allowed'], default: 'JV Not Allowed' },
  jv_partner:       String,
  status:           { type: String, enum: ['New','Under Preparation','Submitted','Evaluation','Awarded','Won','Lost'] },
  awarded_company:  String,
  notes:            String,
}, { timestamps: true });

export default mongoose.model('Tender', tenderSchema);
