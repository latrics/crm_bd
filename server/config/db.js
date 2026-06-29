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
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
