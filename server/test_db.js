import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables relative to this script
dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("Error: MONGO_URI is not defined. Please configure it in server/.env");
  process.exit(1);
}

async function test() {
  try {
    console.log("Connecting...");
    await mongoose.connect(uri);
    console.log("Success! Connected to MongoDB.");

    // Write test to ensure database write works
    console.log("Verifying write capability...");
    const TestSchema = new mongoose.Schema({ test: String }, { collection: 'test_writes' });
    const TestModel = mongoose.models.TestWrite || mongoose.model('TestWrite', TestSchema);
    await TestModel.create({ test: 'verification-' + Date.now() });
    console.log("Write success!");

    // Clean up verification document
    await TestModel.deleteMany({});
    console.log("Cleanup success!");

    process.exit(0);
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
}

test();
