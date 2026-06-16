import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Error: MONGO_URI environment variable is missing.");
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);

  // Users to seed
  const usersToSeed = [
    {
      name: 'Balaji Nagarajan',
      email: process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || 'balaji.nagarajan@latrics.com',
      password: process.env.SUPER_ADMIN_PASSWORD?.trim() || 'SuperAdminPass456!',
      role: 'superadmin',
      isActive: true
    },
    {
      name: 'Souvik Maji',
      email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'souvik.maji@latrics.com',
      password: process.env.ADMIN_PASSWORD?.trim() || 'AdminPass123!',
      role: 'admin',
      isActive: true
    }
  ];

  for (const userData of usersToSeed) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`User ${userData.email} already exists. Deleting...`);
      await User.deleteOne({ _id: existing._id });
    }

    // The pre-save hook in User.js will automatically hash the password
    await User.create(userData);
    console.log(`${userData.role} seeded successfully: ${userData.email}`);
  }

  await mongoose.disconnect();
  console.log('Database seeded successfully.');
}

seed().catch(err => {
  console.error('Seed script failed:', err.message);
  process.exit(1);
});
