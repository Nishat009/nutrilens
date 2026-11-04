// MongoDB schema migration: creates every collection and syncs its indexes from the
// Mongoose models, so a fresh database matches the code without relying on autoIndex.
// Safe to re-run. Usage: npm run db:migrate   (then npm run seed for data)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MODELS = [
  'User', 'Food', 'Meal', 'FoodScan', 'LearnedFoodMatch',
  'PlannedMeal', 'WeightLog', 'DietPlan', 'Vegetable',
];

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set (copy server/.env.example to server/.env)');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, autoIndex: false });

  for (const name of MODELS) {
    const Model = require(path.join(__dirname, '..', 'src', 'models', name));
    await Model.createCollection();
    const dropped = await Model.syncIndexes();
    const indexes = await Model.listIndexes();
    console.log(`${Model.collection.collectionName}: ${indexes.map((index) => index.name).join(', ')}`
      + (dropped.length ? ` (dropped stale: ${dropped.join(', ')})` : ''));
  }
  console.log('Migration complete.');
}

migrate()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
