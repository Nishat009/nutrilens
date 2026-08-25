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

const DIETS_DATA = [
  {
    slug: 'mediterranean',
    name: 'Mediterranean Wellness',
    tagline: 'Heart-healthy, antioxidant-rich whole foods inspired by coastal longevity.',
    description: 'Emphasizes extra virgin olive oil, wild fatty fish, legumes, colorful vegetables, and wholesome unrefined grains.',
    fullOverview: 'The Mediterranean diet is globally heralded as the gold standard for cardiovascular longevity and metabolic vibrancy. Rich in polyphenols, omega-3 fatty acids, and gut-friendly fiber, it provides sustained cellular energy without drastic blood sugar spikes.',
    icon: 'Fish',
    difficulty: 'Easy',
    macroRatio: { protein: 25, carbs: 45, fat: 30 },
    keyBenefits: [
      'Reduces systemic inflammation and CRP levels',
      'Supports optimal HDL / LDL cholesterol profiles',
      'High satiety with polyphenol-rich plant foods',
      'Naturally sustainable long-term lifestyle protocol',
    ],
    allowedFoods: [
      'Wild salmon, tuna, mackerel, sea bass',
      'Cold-pressed Extra Virgin Olive Oil',
      'Greek yogurt, feta, organic eggs',
      'Chickpeas, lentils, black beans',
      'Broccoli, tomatoes, bell peppers, spinach, garlic',
      'Quinoa, whole oats, sourdough',
    ],
    foodsToLimit: [
      'Ultra-processed snack foods and trans fats',
      'Refined sugars and high-fructose corn syrups',
      'Processed deli meats with added nitrates',
      'Refined flour pastries',
    ],
    sampleMealDay: {
      breakfast: 'Poached eggs over sourdough toast with mashed avocado & heirloom cherry tomatoes.',
      lunch: 'Grilled salmon fillet over warm quinoa, steamed broccoli, and kalamata olives with olive oil dressing.',
      dinner: 'Lemon-herb roasted chicken thighs with roasted sweet potatoes and Mediterranean Greek salad.',
      snack: '0% Greek yogurt topped with fresh blueberries, crushed walnuts, and a drizzle of raw honey.',
    },
    isFeatured: true,
  },
  {
    slug: 'high-protein',
    name: 'High Protein / Lean Muscle',
    tagline: 'Engineered for optimal muscle protein synthesis and fat loss retention.',
    description: 'Prioritizes 2.0g-2.4g protein per kg bodyweight with strategic carbohydrates around workout windows.',
    fullOverview: 'Ideal for athletes, gym-goers, and body composition transformation. Protein has the highest thermic effect of food (TEF) and maximizes leucine threshold triggers for muscle repair.',
    icon: 'Dumbbell',
    difficulty: 'Moderate',
    macroRatio: { protein: 40, carbs: 35, fat: 25 },
    keyBenefits: [
      'Maximizes lean muscle accretion and prevents catabolism',
      'High thermic effect boosts daily basal caloric expenditure',
      'Superior hunger suppression through ghrelin reduction',
      'Faster neuromuscular recovery between intense workouts',
    ],
    allowedFoods: [
      'Skinless chicken and turkey breast',
      'Egg whites and whole omega-3 eggs',
      'Whey and casein protein isolate',
      'Lean sirloin steak and 93/7 ground beef',
      'Cottage cheese and non-fat skyr',
      'Jasmine rice, sweet potatoes, oats',
    ],
    foodsToLimit: [
      'High-sugar snacks and empty calories',
      'Deep-fried fatty appetizers',
      'Sugary sodas and alcoholic beverages',
      'High-fat creamy sauces',
    ],
    sampleMealDay: {
      breakfast: '4 egg white + 2 whole egg scramble with spinach, 1 cup rolled oats with 1 scoop whey isolate.',
      lunch: '200g grilled chicken breast with 1.5 cups jasmine rice and steamed asparagus.',
      dinner: '200g lean sirloin steak with baked sweet potato and crisp green salad.',
      snack: '1 cup low-fat cottage cheese with sliced strawberries and 15g raw almonds.',
    },
    isFeatured: true,
  },
  {
    slug: 'ketogenic',
    name: 'Targeted Ketogenic',
    tagline: 'Metabolic flexibility switching from glucose to ketone fuel utilization.',
    description: 'Ultra-low carb (<30g net carbs) with high healthy fats to induce nutritional ketosis and mental focus.',
    fullOverview: 'By drastically reducing carbohydrate intake, the liver converts fatty acids into ketones (acetoacetate and beta-hydroxybutyrate), providing stable clean brain fuel without insulin volatility.',
    icon: 'Flame',
    difficulty: 'Advanced',
    macroRatio: { protein: 25, carbs: 5, fat: 70 },
    keyBenefits: [
      'Eliminates blood sugar rollercoasters and carb crashes',
      'Unlocks fat oxidation for steady baseline endurance',
      'Enhanced cognitive clarity and neurological stability',
      'Rapid reduction in water retention and visceral bloat',
    ],
    allowedFoods: [
      'Hass avocados, avocado oil, MCT oil',
      'Grass-fed butter and ghee',
      'Macadamia nuts, pecans, chia seeds',
      'Ribeye steaks, salmon, pork belly',
      'Cauliflower, zucchini, asparagus, leafy greens',
      'Aged cheeses and heavy cream',
    ],
    foodsToLimit: [
      'All grains (wheat, rice, oats, corn)',
      'High-sugar fruits (bananas, mangoes, grapes)',
      'Starchy root vegetables (potatoes, sweet potatoes)',
      'Legumes and high-carb beans',
    ],
    sampleMealDay: {
      breakfast: '3 eggs fried in grass-fed butter with 1 whole avocado and smoked salmon.',
      lunch: 'Cobb salad with grilled chicken, bacon bits, boiled egg, blue cheese, and olive oil dressing.',
      dinner: 'Pan-seared ribeye steak with garlic-butter sautéed asparagus and cauliflower mash.',
      snack: 'Handful of roasted macadamia nuts and 2 squares of 90% dark chocolate.',
    },
    isFeatured: false,
  },
  {
    slug: 'plant-based',
    name: 'Whole-Food Plant-Based',
    tagline: 'Vibrant phytonutrient abundance for gut microbiome and cardiovascular vitality.',
    description: '100% plant-powered meals maximizing micronutrients, prebiotic fibers, and clean sustainable energy.',
    fullOverview: 'Focuses on unrefined whole botanical sources: legumes, grains, tubers, leafy greens, mushrooms, nuts, and seeds. Supports diverse gut microflora and reduces long-term biomarker risks.',
    icon: 'Leaf',
    difficulty: 'Moderate',
    macroRatio: { protein: 20, carbs: 60, fat: 20 },
    keyBenefits: [
      'Exceptional prebiotic fiber content feeding beneficial gut bacteria',
      'Zero dietary cholesterol and low saturated fat profiles',
      'High antioxidant potential supporting cellular longevity',
      'Environmentally conscious sustainable eating model',
    ],
    allowedFoods: [
      'Lentils, edamame, tempeh, organic tofu',
      'Brown rice, farro, barley, steel-cut oats',
      'Nutritional yeast, hemp seeds, flax seeds',
      'All vegetables, mushrooms, and seasonal fruits',
      'Tahini, almond butter, walnuts',
    ],
    foodsToLimit: [
      'All meat, poultry, dairy, and seafood',
      'Processed vegan junk foods (mock meats with fillers)',
      'Refined bleached flours and white sugars',
    ],
    sampleMealDay: {
      breakfast: 'Superfood smoothie bowl with spinach, frozen berries, pea protein, hemp seeds, and chia.',
      lunch: 'Warm spiced chickpea and roasted sweet potato Buddha bowl with tahini-lemon dressing.',
      dinner: 'Crispy marinated tofu stir-fry with broccoli, bok choy, snap peas, and brown rice.',
      snack: 'Apple slices with natural almond butter and pumpkin seeds.',
    },
    isFeatured: false,
  },
  {
    slug: 'intermittent-fasting',
    name: '16/8 Intermittent Fasting',
    tagline: 'Time-restricted eating window triggering cellular autophagy and insulin sensitivity.',
    description: 'An 8-hour eating window paired with a 16-hour fasting phase for metabolic resets without caloric deprivation.',
    fullOverview: 'Rather than restricting specific food groups, Intermittent Fasting optimizes nutrient timing. Fasted states allow baseline insulin to fall, activating lipolysis and cellular maintenance cascades (autophagy).',
    icon: 'Clock',
    difficulty: 'Easy',
    macroRatio: { protein: 30, carbs: 45, fat: 25 },
    keyBenefits: [
      'Enhances insulin sensitivity and glucose disposal',
      'Simplifies daily meal prep into fewer satisfying meals',
      'Promotes cellular autophagy and anti-aging pathways',
      'Reduces late-night mindless snacking and acid reflux',
    ],
    allowedFoods: [
      'During Fast: Black coffee, unsweetened green tea, water with electrolytes',
      'During Window: Nutrient-dense balanced whole foods across 2-3 main meals',
    ],
    foodsToLimit: [
      'Any caloric liquids during the 16-hour fasting window',
      'Binge-eating junk food to break fasts',
    ],
    sampleMealDay: {
      breakfast: 'Fasting period (08:00 - 12:00): Sparkling water & black roast espresso.',
      lunch: '12:00 (Break-Fast): Big Mediterranean bowl with grilled chicken, avocado, quinoa, and greens.',
      dinner: '19:30 (Final Meal): Pan-seared salmon with roasted sweet potatoes and asparagus.',
      snack: '16:00: Protein shake with berries and a handful of mixed nuts.',
    },
    isFeatured: false,
  },
  {
    slug: 'dash',
    name: 'DASH Protocol',
    tagline: 'Dietary Approaches to Stop Hypertension and optimize arterial elasticity.',
    description: 'Rich in potassium, magnesium, and calcium with reduced sodium for optimal blood pressure.',
    fullOverview: 'Clinically proven by the NIH, the DASH diet balances essential electrolytes (high potassium, calcium, magnesium with controlled sodium) to support vascular endothelium function.',
    icon: 'HeartPulse',
    difficulty: 'Easy',
    macroRatio: { protein: 25, carbs: 50, fat: 25 },
    keyBenefits: [
      'Clinically proven to lower systolic and diastolic blood pressure',
      'Supports healthy kidney filtration and fluid balance',
      'Rich in cardioprotective minerals and micronutrients',
      'Easy to adhere to with family-friendly everyday ingredients',
    ],
    allowedFoods: [
      'Bananas, oranges, apricots, berries',
      'Dark leafy greens, carrots, beets, tomatoes',
      'Low-fat yogurt and skim milk',
      'Skinless poultry and fish',
      'Beans, lentils, seeds, and unsalted nuts',
    ],
    foodsToLimit: [
      'High-sodium canned soups and cured meats',
      'Processed cheese and table salt excess',
      'Store-bought packaged dressings with preservatives',
    ],
    sampleMealDay: {
      breakfast: 'Oatmeal cooked in low-fat milk, topped with sliced banana and cinnamon.',
      lunch: 'Turkey breast wrap with whole grain tortilla, spinach, sliced tomatoes, and hummus.',
      dinner: 'Baked cod fillet with steamed green beans and baked potato topped with low-fat Greek yogurt.',
      snack: 'Unsalted pistachios and an organic crisp apple.',
    },
    isFeatured: false,
  },
];

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrilens';
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB: ${conn.connection.host}`);

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

    // 2. Seed Foods
    const foods = await Food.insertMany(FOODS_DATA);
    console.log(`🥗 Seeded ${foods.length} food items`);

    // 2b. Seed Researched Dedicated Vegetables
    const vegetables = await Vegetable.insertMany(VEGETABLES_DATA);
    console.log(`🥦 Seeded ${vegetables.length} dedicated researched USDA vegetables`);

    // 3. Seed Diet Plans

    const diets = await DietPlan.insertMany(DIETS_DATA);
    console.log(`📖 Seeded ${diets.length} clinical diet protocols`);

    const todayStr = new Date().toISOString().split('T')[0];

    // 4. Seed Meals
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

    // 5. Seed Food Scans
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
    console.error('❌ Database seeding error:', err);
    process.exit(1);
  }
};

seedDB();
