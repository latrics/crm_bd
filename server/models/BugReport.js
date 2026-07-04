import mongoose from 'mongoose';

const BugReportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a short title describing the bug'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description of the bug'],
    trim: true
  },
  stepsToReproduce: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  pageUrl: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  }
}, { timestamps: true });

export default mongoose.model('BugReport', BugReportSchema);
