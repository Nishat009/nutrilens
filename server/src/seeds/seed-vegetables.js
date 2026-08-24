const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vegetable = require('../models/Vegetable');
const { VEGETABLES_DATA } = require('../data/vegetables-data');

dotenv.config();

async function seedVegetables() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrilens';
  
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(uri);
    console.log(`🌿 Connected to MongoDB at ${uri}`);
  }

  console.log('🧹 Clearing existing Vegetable collection...');
  await Vegetable.deleteMany({});

  console.log(`🌱 Seeding ${VEGETABLES_DATA.length} researched USDA vegetables...`);
  
  const createdVegetables = await Vegetable.insertMany(VEGETABLES_DATA);
  console.log(`✅ Successfully seeded ${createdVegetables.length} vegetables into database!`);

  return createdVegetables;
}

if (require.main === module) {
  seedVegetables()
    .then(() => {
      console.log('✨ Vegetable seeding completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Vegetable seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seedVegetables;
