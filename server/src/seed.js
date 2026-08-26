const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Food = require('./models/Food');
const Meal = require('./models/Meal');
const FoodScan = require('./models/FoodScan');
const WeightLog = require('./models/WeightLog');
const DietPlan = require('./models/DietPlan');
const PlannedMeal = require('./models/PlannedMeal');
const Vegetable = require('./models/Vegetable');
const { VEGETABLES_DATA } = require('./data/vegetables-data');

const FOODS_DATA = [
  {
    name: 'Grilled Chicken Breast',
    category: 'Poultry & Meat',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&auto=format&fit=crop&q=80',
    tags: ['High Protein', 'Lean', 'Keto Friendly'],
  },
  {
    name: 'Atlantic Salmon Fillet',
    category: 'Fish & Seafood',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=80',
    tags: ['Omega-3', 'High Protein', 'Healthy Fats'],
  },
  {
    name: 'Steamed Brown Rice',
    category: 'Grains & Rice',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9, fiber: 1.8 },
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
    tags: ['Complex Carbs', 'Gluten Free'],
  },
  {
    name: 'Hass Avocado',
    category: 'Fruits & Healthy Fats',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7 },
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&auto=format&fit=crop&q=80',
    tags: ['High Fiber', 'Monounsaturated Fats', 'Keto'],
  },
  {
    name: 'Whole Poached Eggs',
    category: 'Dairy & Eggs',
    servingSize: 100,
    servingUnit: 'g (approx 2 eggs)',
    nutrition: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0 },
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=80',
    tags: ['Complete Protein', 'Choline'],
  },
  {
    name: '0% Fat Greek Yogurt',
    category: 'Dairy',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 59, protein: 10.2, carbs: 3.6, fat: 0.4, fiber: 0 },
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80',
    tags: ['Probiotics', 'High Protein'],
  },
  {
    name: 'Roasted Sweet Potato',
    category: 'Vegetables & Tubers',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3 },
    imageUrl: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=400&auto=format&fit=crop&q=80',
    tags: ['Vitamin A', 'Slow Digesting'],
  },
  {
    name: 'Steamed Broccoli Florets',
    category: 'Vegetables',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 2.6 },
    imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&auto=format&fit=crop&q=80',
    tags: ['Micronutrient Rich', 'Low Calorie'],
  },
  {
    name: 'Cooked Quinoa',
    category: 'Grains & Seeds',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8 },
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
    tags: ['Complete Plant Protein', 'Gluten Free'],
  },
  {
    name: 'Raw California Almonds',
    category: 'Nuts & Seeds',
    servingSize: 30,
    servingUnit: 'g (handful)',
    nutrition: { calories: 173, protein: 6.4, carbs: 6.1, fat: 15, fiber: 3.5 },
    imageUrl: 'https://images.unsplash.com/photo-1508061252445-5350f3ab0a55?w=400&auto=format&fit=crop&q=80',
    tags: ['Magnesium', 'Vitamin E'],
  },
  {
    name: 'Rolled Oats (Dry)',
    category: 'Grains & Breakfast',
    servingSize: 50,
    servingUnit: 'g',
    nutrition: { calories: 190, protein: 6.8, carbs: 34, fat: 3.5, fiber: 5.2 },
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&auto=format&fit=crop&q=80',
    tags: ['Beta-Glucan', 'Heart Health'],
  },
  {
    name: 'Extra Virgin Olive Oil',
    category: 'Oils & Fats',
    servingSize: 15,
    servingUnit: 'ml (1 tbsp)',
    nutrition: { calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0 },
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
    tags: ['Polyphenols', 'Mediterranean'],
  },
  {
    name: 'Ripe Banana',
    category: 'Fruits',
    servingSize: 120,
    servingUnit: 'g (1 medium)',
    nutrition: { calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1 },
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80',
    tags: ['Potassium', 'Pre-Workout Fuel'],
  },
  {
    name: 'Fresh Blueberries',
    category: 'Fruits',
    servingSize: 100,
    servingUnit: 'g',
    nutrition: { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4 },
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&auto=format&fit=crop&q=80',
    tags: ['Anthocyanins', 'Antioxidants'],
  },
  {
    name: 'Whey Protein Isolate Powder',
    category: 'Supplements',
    servingSize: 30,
    servingUnit: 'g (1 scoop)',
    nutrition: { calories: 110, protein: 25, carbs: 1, fat: 0.5, fiber: 0 },
    imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400&auto=format&fit=crop&q=80',
    tags: ['Fast Absorbing', 'BCAAs'],
  },
];

const { DIETS_DATA } = require('./data/diet-plans');

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrilens';
    console.log('Connecting to database...');
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Food.deleteMany({}),
      Vegetable.deleteMany({}),
      Meal.deleteMany({}),
      FoodScan.deleteMany({}),
      WeightLog.deleteMany({}),
      DietPlan.deleteMany({}),
      PlannedMeal.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing database collections');


    // 1. Seed User
    const user = await User.create({
      name: 'Alex Morgan',
      email: 'alex.morgan@nutrilens.ai',
      password: 'password123',
      gender: 'male',
      dob: '1998-05-14',
      heightCm: 178,
      weightKg: 74.5,
      targetWeightKg: 72.0,
      activityLevel: 'moderately_active',
      dietaryPreferences: [
        'High Protein / Gym',
        'Mediterranean',
        'Intermittent Fasting (16/8)',
      ],
      allergies: ['Peanuts'],
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      goal: {
        type: 'lose_weight',
        targetCalories: 2150,
        targetProteinG: 160,
        targetCarbsG: 210,
        targetFatG: 65,
        targetFiberG: 32,
        targetWaterMl: 3000,
        weeklyWeightChangeKg: -0.5,
        isActive: true,
      },
    });
    console.log(`👤 Seeded User: ${user.name} (${user._id})`);

    // 2. Seed Foods from comprehensive 100+ database
    const { NUTRITION_DATABASE } = require('./data/nutrition-database');
    const foodsToInsert = NUTRITION_DATABASE.map((item) => ({
      name: item.name,
      category: item.category,
      servingSize: item.defaultPortion || 100,
      servingUnit: item.unit || 'g',
      nutrition: {
        calories: item.caloriesPer100g,
        protein: item.proteinPer100g,
        carbs: item.carbsPer100g,
        fat: item.fatPer100g,
        fiber: item.fiberPer100g,
      },
      imageUrl: item.imageUrl || '',
      tags: [...(item.tags || []), ...(item.aliases || [])],
    }));
    const foods = await Food.insertMany(foodsToInsert);
    console.log(`🥗 Seeded ${foods.length} comprehensive 100+ food and vegetable items`);

    // 2b. Seed Researched Dedicated Vegetables
    const vegetables = await Vegetable.insertMany(VEGETABLES_DATA);
    console.log(`🥦 Seeded ${vegetables.length} dedicated researched USDA vegetables`);

    // 3. Seed Diet Plans

    const diets = await DietPlan.insertMany(DIETS_DATA);
    console.log(`📖 Seeded ${diets.length} clinical diet protocols`);

    // 4. Meals & Scans start clean for fresh user logging
    console.log('🍲 Fresh user state initialized with 0 meals logged (clean slate)');
    console.log('📸 Fresh food scans initialized (clean slate)');

    // 6. Seed Weekly Planned Meals
    const plannedMeals = await PlannedMeal.insertMany([
      { userId: user._id, dayOfWeek: 0, mealType: 'breakfast', foodName: 'Oatmeal with Whey & Berries', calories: 420, protein: 32, carbs: 54, fat: 8 },
      { userId: user._id, dayOfWeek: 0, mealType: 'lunch', foodName: 'Grilled Salmon Quinoa Bowl', calories: 650, protein: 48, carbs: 62, fat: 18 },
      { userId: user._id, dayOfWeek: 0, mealType: 'dinner', foodName: 'Chicken Sweet Potato Mash', calories: 580, protein: 52, carbs: 50, fat: 12 },
      { userId: user._id, dayOfWeek: 0, mealType: 'snack', foodName: 'Greek Yogurt & Almonds', calories: 240, protein: 20, carbs: 12, fat: 10 },

      { userId: user._id, dayOfWeek: 1, mealType: 'breakfast', foodName: 'Poached Eggs & Avocado Toast', calories: 460, protein: 24, carbs: 36, fat: 22 },
      { userId: user._id, dayOfWeek: 1, mealType: 'lunch', foodName: 'Turkey & Brown Rice Skillet', calories: 610, protein: 50, carbs: 60, fat: 14 },
      { userId: user._id, dayOfWeek: 1, mealType: 'dinner', foodName: 'Sirloin Steak with Asparagus', calories: 620, protein: 54, carbs: 20, fat: 24 },
      { userId: user._id, dayOfWeek: 1, mealType: 'snack', foodName: 'Whey Isolate Shake & Banana', calories: 215, protein: 26, carbs: 28, fat: 1 },

      { userId: user._id, dayOfWeek: 2, mealType: 'breakfast', foodName: 'Egg White Frittata with Feta', calories: 380, protein: 35, carbs: 14, fat: 16 },
      { userId: user._id, dayOfWeek: 2, mealType: 'lunch', foodName: 'Mediterranean Tuna Wrap', calories: 540, protein: 44, carbs: 48, fat: 14 },
      { userId: user._id, dayOfWeek: 2, mealType: 'dinner', foodName: 'Herb Chicken with Broccoli', calories: 520, protein: 55, carbs: 24, fat: 12 },
      { userId: user._id, dayOfWeek: 2, mealType: 'snack', foodName: 'Cottage Cheese & Berries', calories: 190, protein: 22, carbs: 16, fat: 3 },
    ]);
    console.log(`📅 Seeded ${plannedMeals.length} weekly planned meal slots`);

    // 7. Seed 30 Days of Weight Logs
    const weightLogsData = [];
    let currentWeight = 76.2;
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const fluctuation = (Math.random() - 0.5) * 0.3;
      const trend = -0.055;
      currentWeight = Math.max(
        73.5,
        Math.round((currentWeight + trend + fluctuation) * 10) / 10
      );

      weightLogsData.push({
        userId: user._id,
        date: dateStr,
        weightKg: currentWeight,
        notes: i % 7 === 0 ? 'Weekly check-in' : '',
      });
    }

    const weightLogs = await WeightLog.insertMany(weightLogsData);
    console.log(`⚖️  Seeded ${weightLogs.length} weight history logs`);

    console.log('✨ Database seeding successfully finished!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database seeding error:', err.message);
    if (err.message && (err.message.includes('SSL') || err.message.includes('ServerSelection') || err.message.includes('tlsv1'))) {
      console.log('\n💡 TIP: This usually means your current IP address is not whitelisted in MongoDB Atlas:');
      console.log('1. Go to https://cloud.mongodb.com → Security → Network Access');
      console.log('2. Click "+ ADD IP ADDRESS" → Select "ALLOW ACCESS FROM ANYWHERE (0.0.0.0/0)" or "ADD CURRENT IP"');
      console.log('3. Click Confirm, wait 1 minute for it to become Active, then run "npm run seed" again.\n');
    }
    process.exit(1);
  }
};

seedDB();
