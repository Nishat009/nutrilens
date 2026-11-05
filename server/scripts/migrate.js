// MongoDB schema migration: creates every collection and syncs its indexes from the
// Mongoose models, so a fresh database matches the code without relying on autoIndex.
// Safe to re-run. Usage: npm run db:migrate   (then npm run seed for data)
//
// Index changes are reviewed first: missing indexes are always created, but an index that exists in
// the database and not in the models is only dropped outside production, or in production with
// --confirm (npm run db:migrate -- --confirm). Without it the stale indexes are listed and kept.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MODELS = [
  'User', 'Food', 'Meal', 'FoodScan', 'LearnedFoodMatch',
  'PlannedMeal', 'WeightLog', 'DietPlan', 'Vegetable',
];

const allowDrop = process.env.NODE_ENV !== 'production' || process.argv.includes('--confirm');

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set (copy server/.env.example to server/.env)');
  const skipped = [];
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, autoIndex: false });

  for (const name of MODELS) {
    const Model = require(path.join(__dirname, '..', 'src', 'models', name));
    await Model.createCollection();
    const { toDrop } = await Model.diffIndexes();
    if (allowDrop) await Model.syncIndexes();
    else await Model.createIndexes();
    const indexes = await Model.listIndexes();
    let note = '';
    if (toDrop.length) note = allowDrop ? ` (dropped stale: ${toDrop.join(', ')})` : ` (stale, kept: ${toDrop.join(', ')})`;
    console.log(`${Model.collection.collectionName}: ${indexes.map((index) => index.name).join(', ')}${note}`);
    if (toDrop.length && !allowDrop) skipped.push(...toDrop.map((index) => `${Model.collection.collectionName}.${index}`));
  }
  if (skipped.length) {
    console.warn(`Production: ${skipped.length} stale index(es) kept. Review them, then re-run with --confirm to drop.`);
  }
  console.log('Migration complete.');
}

migrate()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
