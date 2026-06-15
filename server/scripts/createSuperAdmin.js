import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Role from '../models/Role.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createSuperAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure the super_admin role exists
    let superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full unrestricted system access',
        hierarchy: 0,
        permissions: ['*'] 
      });
      console.log('Super Admin role created');
    }

    // 2. Clear ALL existing Super Admins to ensure only the requested users have access
    await User.deleteMany({ role: 'super_admin' });
    console.log('Cleared all prior Super Admin accounts');

    // 3. Create other roles if they don't exist
    const roles = [
      { name: 'admin', displayName: 'Administrator', hierarchy: 1 },
      { name: 'manager', displayName: 'Manager', hierarchy: 2 },
      { name: 'employee', displayName: 'Employee', hierarchy: 3 }
    ];

    for (const r of roles) {
      const exists = await Role.findOne({ name: r.name });
      if (!exists) {
        await Role.create({ ...r, permissions: [] });
        console.log(`${r.displayName} role created`);
      }
    }

    // 4. Create Super Admins from .env
    const superAdmins = [
      { email: process.env.SUPER_ADMIN_EMAIL?.trim(), password: process.env.SUPER_ADMIN_PASSWORD?.trim(), name: 'Souvik Maji' },
      { email: process.env.SECOND_SUPER_ADMIN_EMAIL?.trim(), password: process.env.SECOND_SUPER_ADMIN_PASSWORD?.trim(), name: 'Balaji Nagarajan' }
    ];

    for (const adminData of superAdmins) {
      if (!adminData.email || !adminData.password) {
        console.warn(`Skipping admin creation: Missing credentials in .env for ${adminData.name}`);
        continue;
      }

      console.log(`Creating Super Admin: ${adminData.email} with password: ${adminData.password}`);
      await User.create({
        name: adminData.name,
        email: adminData.email.toLowerCase(),
        password: adminData.password,
        role: 'super_admin',
        isActive: true,
        permissions: ['*']
      });
      console.log(`New Super Admin created: ${adminData.email}`);
    }

    console.log('System initialized with new Super Admins successfully');
    process.exit();
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

createSuperAdmins();
