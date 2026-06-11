import mongoose from 'mongoose';

const docSchema = new mongoose.Schema({
  entity_id:   { type: mongoose.Schema.Types.ObjectId, required: true },
  entity_type: { type: String, enum: ['lead','deal'], required: true },
  name:        { type: String, required: true },
  size:        Number,
  mime_type:   String,
  doc_type:    { type: String, enum: ['Quotation','Agreement','Purchase Order','Contract','Others'] },
  stage:       String,
  note:        String,
  data_url:    String,   // base64 stored in DB (or swap for GridFS/S3 URL in production)
}, { timestamps: true });

export default mongoose.model('Doc', docSchema);
