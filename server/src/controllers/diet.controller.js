const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const mongoose = require('mongoose');
const {
  CANONICAL_DIETS,
  resolveDietPlan,
  validateDietAdoption,
  calculatePersonalizedTargets,
  rankDietsForUser,
} = require('../services/nutrition-intelligence');

// Helper to resolve or find active user
async function resolveUserId(providedId) {
  if (providedId && providedId !== 'current') {
    return providedId;
  }
  const existing = await User.findOne();
  if (existing) return existing._id;

  const newUser = await User.create({
    name: 'Demo User',
    email: 'user@nutrilens.ai',
    gender: 'female',
    dob: '1998-05-15',
    heightCm: 165,
    weightKg: 68,
    activityLevel: 'moderately_active',
    dietaryPreferences: ['PCOS & Hormone Balance Diet'],
    activeDietId: 'pcos_hormone_balance',
    allergies: [],
    medicalConditions: ['pcos'],
    goal: {
      type: 'lose_weight',
      targetCalories: 1750,
      targetProteinG: 130,
      targetCarbsG: 155,
      targetFatG: 68,
      targetFiberG: 30,
      targetWaterMl: 2600,
    },
  });
  return newUser._id;
}

// @desc    Get all diet plans (Canonical 20)
// @route   GET /api/diets
exports.getDiets = async (req, res) => {
  try {
    const dbDiets = await DietPlan.find();
    if (dbDiets && dbDiets.length > 0) {
      return res.status(200).json({
        success: true,
        code: 200,
        count: dbDiets.length,
        data: dbDiets,
      });
    }
    res.status(200).json({
      success: true,
      code: 200,
      count: CANONICAL_DIETS.length,
      data: CANONICAL_DIETS,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      code: 200,
      count: CANONICAL_DIETS.length,
      data: CANONICAL_DIETS,
    });
  }
};

// @desc    Get diet plan by slug or canonical ID
// @route   GET /api/diets/:slug
exports.getDietBySlug = async (req, res) => {
  try {
    const query = req.params.slug;
    let diet = await DietPlan.findOne({
      $or: [{ slug: query }, { id: query }, { name: query }],
    });
    if (!diet) {
      diet = resolveDietPlan(query);
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Diet protocol retrieved successfully',
      data: diet,
    });
  } catch (error) {
    const diet = resolveDietPlan(req.params.slug);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Diet protocol retrieved from local catalog',
      data: diet,
    });
  }
};

// @desc    Adopt a diet plan with safety validation & personalized targets
// @route   POST /api/diets/adopt
exports.adoptDiet = async (req, res) => {
  try {
    let { userId, dietName, dietId } = req.body;
    userId = await resolveUserId(userId);

    const targetIdentifier = dietId || dietName;
    if (!targetIdentifier) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Diet identifier (id, slug, or name) is required'],
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['User profile not found'],
      });
    }

    // Step 1: Safety & Eligibility Validation
    const validation = validateDietAdoption(user, targetIdentifier);
    if (!validation.canAdopt) {
      return res.status(200).json({
        success: true,
        code: 200,
        canAdopt: false,
        status: validation.status,
        message: validation.message,
        requiredAction: validation.requiredAction || null,
        professionalReviewRequired: validation.professionalReviewRequired || false,
        data: null,
      });
    }

    const matchedDiet = validation.dietPlan || resolveDietPlan(targetIdentifier);

    // Step 2: Calculate Personalized Nutritional Targets
    const personalizedTargets = calculatePersonalizedTargets(user, matchedDiet);

    // Step 3: Update User Profile & Goal
    user.activeDietId = matchedDiet.id || matchedDiet.slug;
    user.dietaryPreferences = [matchedDiet.name];

    if (!user.goal) user.goal = {};
    user.goal.targetCalories = personalizedTargets.targetCalories;
    user.goal.targetProteinG = personalizedTargets.targetProteinG;
    user.goal.targetCarbsG = personalizedTargets.targetCarbsG;
    user.goal.targetFatG = personalizedTargets.targetFatG;
    user.goal.targetFiberG = personalizedTargets.targetFiberG;
    user.goal.targetWaterMl = personalizedTargets.targetWaterMl;

    await user.save();

    res.status(200).json({
      success: true,
      code: 200,
      status: 'adopted',
      message: `Protocol '${matchedDiet.name}' adopted with individualized targets`,
      data: {
        activeDiet: matchedDiet,
        personalizedTargets,
        user,
      },
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to adopt diet protocol'],
    });
  }
};

// @desc    Get ranked diet recommendations for a user profile
// @route   GET /api/diets/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    let userId = await resolveUserId(req.query.userId);
    const user = userId ? await User.findById(userId) : {};
    const rankedDiets = rankDietsForUser(user || {});

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Personalized diet recommendations calculated',
      data: rankedDiets,
    });
  } catch (error) {
    const defaultRanked = rankDietsForUser({});
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Default diet recommendations calculated',
      data: defaultRanked,
    });
  }
};

