import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const checkHash = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'balaji.nagarajan@latrics.com';
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    console.log('Current hash in DB:', user.password);
    
    const testPassword = 'latCRM@2026';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log(`Does '${testPassword}' match?`, isMatch);
    console.log(`Is User Active?`, user.isActive);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkHash();
