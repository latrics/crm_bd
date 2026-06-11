import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env variables from .env
dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("Error: MONGO_URI is not defined. Please configure it in server/.env");
  process.exit(1);
}

async function test() {
  try {
    console.log("Connecting...");
    await mongoose.connect(uri);
    console.log("Success!");
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
}

test();
