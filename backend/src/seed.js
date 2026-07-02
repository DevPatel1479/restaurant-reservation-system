import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Table } from './models/Table.js';

const seed = async () => {
  await connectDB(process.env.MONGODB_URI);

  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@restaurant.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin123!@#';
  const adminName = process.env.ADMIN_SEED_NAME || 'Restaurant Admin';

  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({ name: adminName, email: adminEmail, passwordHash, role: 'admin' });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  const tables = [
    { name: 'T1', capacity: 2 },
    { name: 'T2', capacity: 2 },
    { name: 'T3', capacity: 4 },
    { name: 'T4', capacity: 4 },
    { name: 'T5', capacity: 4 },
    { name: 'T6', capacity: 6 },
    { name: 'T7', capacity: 6 },
    { name: 'T8', capacity: 8 },
    { name: 'T9', capacity: 8 },
    { name: 'T10', capacity: 10 }
  ];

  for (const table of tables) {
    await Table.updateOne(
      { name: table.name },
      { $setOnInsert: { ...table, isActive: true } },
      { upsert: true }
    );
  }

  console.log('Tables seeded/verified');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
