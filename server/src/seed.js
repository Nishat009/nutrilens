const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Food = require('./models/Food');
const Meal = require('./models/Meal');
const FoodScan = require('./models/FoodScan');
const WeightLog = require('./models/WeightLog');

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

const seedDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrilens'
    );
    console.log(`Connected to MongoDB: ${conn.connection.host}`);

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Food.deleteMany({}),
      Meal.deleteMany({}),
      FoodScan.deleteMany({}),
      WeightLog.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing database collections');

    // 1. Seed User
    const user = await User.create({
      name: 'Prantik Mitra',
      email: 'prantik@nutrilens.ai',
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

    // 2. Seed Foods
    const foods = await Food.insertMany(FOODS_DATA);
    console.log(`🥗 Seeded ${foods.length} food items`);

    const todayStr = new Date().toISOString().split('T')[0];

    // 3. Seed Meals
    const meals = await Meal.insertMany([
      {
        userId: user._id,
        type: 'breakfast',
        date: todayStr,
        time: '08:30',
        totalCalories: 485,
        totalProtein: 34,
        totalCarbs: 45,
        totalFat: 17,
        totalFiber: 8.5,
        imageUrl:
          'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
        notes: 'Post-morning run breakfast bowl',
        items: [
          {
            foodName: 'Whole Poached Eggs',
            quantity: 2,
            unit: 'large',
            calories: 143,
            protein: 12.6,
            carbs: 0.7,
            fat: 9.5,
            fiber: 0,
            confidence: 0.98,
          },
          {
            foodName: 'Rolled Oats Bowl with Blueberries',
            quantity: 1,
            unit: 'bowl (50g oats + 50g berries)',
            calories: 218,
            protein: 7.2,
            carbs: 41.2,
            fat: 3.6,
            fiber: 6.4,
            confidence: 0.95,
          },
          {
            foodName: '0% Fat Greek Yogurt',
            quantity: 120,
            unit: 'g',
            calories: 71,
            protein: 12.2,
            carbs: 4.3,
            fat: 0.5,
            fiber: 0,
            confidence: 0.92,
          },
          {
            foodName: 'Hass Avocado Slices',
            quantity: 35,
            unit: 'g',
            calories: 56,
            protein: 0.7,
            carbs: 3.0,
            fat: 5.1,
            fiber: 2.3,
            confidence: 0.89,
          },
        ],
      },
      {
        userId: user._id,
        type: 'lunch',
        date: todayStr,
        time: '13:15',
        totalCalories: 645,
        totalProtein: 54,
        totalCarbs: 68,
        totalFat: 16,
        totalFiber: 10.2,
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
        notes: 'NutriLens AI Scanned Mediterranean power bowl',
        items: [
          {
            foodName: 'Grilled Herb Chicken Breast',
            quantity: 160,
            unit: 'g',
            calories: 264,
            protein: 49.6,
            carbs: 0,
            fat: 5.8,
            fiber: 0,
            confidence: 0.97,
          },
          {
            foodName: 'Steamed Brown Rice & Quinoa',
            quantity: 180,
            unit: 'g',
            calories: 215,
            protein: 5.8,
            carbs: 42.5,
            fat: 2.4,
            fiber: 4.2,
            confidence: 0.94,
          },
          {
            foodName: 'Roasted Broccoli & Bell Peppers',
            quantity: 150,
            unit: 'g',
            calories: 78,
            protein: 3.6,
            carbs: 14.2,
            fat: 1.2,
            fiber: 5.8,
            confidence: 0.91,
          },
          {
            foodName: 'Cold Pressed Extra Virgin Olive Oil',
            quantity: 10,
            unit: 'ml',
            calories: 88,
            protein: 0,
            carbs: 0,
            fat: 9.8,
            fiber: 0,
            confidence: 0.85,
          },
        ],
      },
      {
        userId: user._id,
        type: 'snack',
        date: todayStr,
        time: '16:45',
        totalCalories: 283,
        totalProtein: 28,
        totalCarbs: 28,
        totalFat: 6,
        totalFiber: 4.5,
        imageUrl:
          'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=80',
        notes: 'Pre-workout shake & banana',
        items: [
          {
            foodName: 'Whey Protein Isolate',
            quantity: 30,
            unit: 'g (1 scoop)',
            calories: 110,
            protein: 25,
            carbs: 1,
            fat: 0.5,
            fiber: 0,
            confidence: 0.99,
          },
          {
            foodName: 'Fresh Banana',
            quantity: 120,
            unit: 'g (1 medium)',
            calories: 105,
            protein: 1.3,
            carbs: 27,
            fat: 0.3,
            fiber: 3.1,
            confidence: 0.96,
          },
          {
            foodName: 'Raw Almonds',
            quantity: 12,
            unit: 'g',
            calories: 68,
            protein: 2.5,
            carbs: 2.4,
            fat: 5.9,
            fiber: 1.4,
            confidence: 0.92,
          },
        ],
      },
    ]);
    console.log(`🍲 Seeded ${meals.length} meals`);

    // 4. Seed Food Scans
    const scans = await FoodScan.insertMany([
      {
        userId: user._id,
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        status: 'completed',
        suggestedMealType: 'lunch',
        analysisNotes:
          'NutriLens Multimodal Vision identified 4 distinct food items with high semantic confidence.',
        totalCalories: 645,
        totalProtein: 54,
        totalCarbs: 68,
        totalFat: 16,
        totalFiber: 10.2,
        detectedItems: [
          {
            name: 'Grilled Herb Chicken Breast',
            confidence: 0.97,
            estimatedQuantity: 160,
            unit: 'g',
            calories: 264,
            protein: 49.6,
            carbs: 0,
            fat: 5.8,
            fiber: 0,
          },
          {
            name: 'Steamed Brown Rice & Quinoa',
            confidence: 0.94,
            estimatedQuantity: 180,
            unit: 'g',
            calories: 215,
            protein: 5.8,
            carbs: 42.5,
            fat: 2.4,
            fiber: 4.2,
          },
          {
            name: 'Roasted Broccoli & Red Peppers',
            confidence: 0.91,
            estimatedQuantity: 150,
            unit: 'g',
            calories: 78,
            protein: 3.6,
            carbs: 14.2,
            fat: 1.2,
            fiber: 5.8,
          },
          {
            name: 'Extra Virgin Olive Oil Dressing',
            confidence: 0.85,
            estimatedQuantity: 10,
            unit: 'ml',
            calories: 88,
            protein: 0,
            carbs: 0,
            fat: 9.8,
            fiber: 0,
          },
        ],
      },
    ]);
    console.log(`📸 Seeded ${scans.length} food scans`);

    // 5. Seed 30 Days of Weight Logs
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
    console.error('❌ Database seeding error:', err);
    process.exit(1);
  }
};

seedDB();
