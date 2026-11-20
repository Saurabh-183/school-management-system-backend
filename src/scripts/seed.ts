import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { runSeed } from '../services/seed.service.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed CLI] Running database seed...');
    const result = await runSeed(true);
    console.log('[Seed CLI] Seed finished successfully:');
    console.log(JSON.stringify(result, null, 2));
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed CLI Error] Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
