import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Drop the unique email index from invitations collection to support re-invites
    try {
      await conn.connection.db.collection('invitations').dropIndex('email_1');
      console.log('Successfully dropped old unique index "email_1" from invitations collection.');
    } catch (err) {
      // The index might not exist yet, which is fine
      if (err.codeName !== 'IndexNotFound') {
        console.warn('Non-critical index drop warning:', err.message);
      }
    }

    // Perform cleanup of zombie/orphaned Leads (status === 'Converted' with no corresponding Deal)
    try {
      const Lead = mongoose.models.Lead || mongoose.model('Lead');
      const Deal = mongoose.models.Deal || mongoose.model('Deal');
      
      const convertedLeads = await Lead.find({ status: 'Converted' });
      let cleanupCount = 0;
      for (const lead of convertedLeads) {
        const dealExists = await Deal.exists({ from_lead_id: lead._id });
        if (!dealExists) {
          await Lead.findByIdAndDelete(lead._id);
          cleanupCount++;
        }
      }
      if (cleanupCount > 0) {
        console.log(`Successfully cleaned up ${cleanupCount} zombie/orphaned converted leads.`);
      }
    } catch (cleanupErr) {
      console.warn('Non-critical zombie lead cleanup warning:', cleanupErr.message);
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
