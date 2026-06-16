import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedSuperAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set in environment variables');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Email of Balaji Nagarajan
    const email = process.env.SECOND_SUPER_ADMIN_EMAIL?.trim().toLowerCase() || 'balaji.nagarajan@latrics.com';
    const password = process.env.SECOND_SUPER_ADMIN_PASSWORD?.trim() || 'SecondAdminPass456!';
    const name = 'Balaji Nagarajan';

    // Delete existing users with this email to be idempotent
    await User.deleteMany({ email });
    console.log(`Deleted any existing user with email ${email}`);

    // Create the superadmin user
    // The pre-save hook in User model will hash this password with bcryptjs (salt cost 12)
    const newAdmin = await User.create({
      name,
      email,
      password,
      role: 'superadmin',
      isActive: true
    });

    console.log('----------------------------------------------------');
    console.log('SUPER ADMIN SEEDED SUCCESSFUL:');
    console.log(`Name: ${newAdmin.name}`);
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Role: ${newAdmin.role}`);
    console.log(`isActive: ${newAdmin.isActive}`);
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
