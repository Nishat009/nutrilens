const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const {
  generatePersonalizedDietRecommendation,
  getFoodSwaps,
  reviewAdaptiveProgress,
} = require('../services/diet-recommendation-engine');
const mongoose = require('mongoose');
const {
  CANONICAL_DIETS,
  resolveDietPlan,
  validateDietAdoption,
  calculatePersonalizedTargets,
  rankDietsForUser,
} = require('../services/nutrition-intelligence');

// Helper to resolve or find active user
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
    let diet = await DietPlan.findOne({ $or: [{ slug: query }, { id: query }, { name: query }] });
    if (!diet) diet = resolveDietPlan(query);
    if (!diet) return res.status(422).json({ success: false, code: 422, errors: ['Diet protocol not found'] });
    res.status(200).json({ success: true, code: 200, message: 'Diet protocol retrieved successfully', data: diet });
  } catch (error) {
    res.status(422).json({ success: false, code: 422, errors: [error.message || 'Failed to retrieve diet protocol'] });
  }
};

// @desc    Adopt / select a diet plan for user
// @route   POST /api/diets/adopt
exports.adoptDiet = async (req, res) => {
  try {
    const { dietName, dietId } = req.body;

    const targetIdentifier = dietId || dietName;
    if (!targetIdentifier) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Diet identifier (id, slug, or name) is required'],
      });
    }

    const user = req.user;
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
      errors: [error.message || 'Failed to adopt diet plan'],
    });
  }
};

// @desc    Generate a complete personalized diet recommendation & 7-day meal plan
// @route   POST /api/diets/recommend
exports.getPersonalizedRecommendation = async (req, res) => {
  try {
    const userProfile = req.body || {};
    const recommendation = generatePersonalizedDietRecommendation(userProfile);

    // Keep the generated plan on the authenticated profile.
    if (req.user?._id) {
      try {
        await User.findByIdAndUpdate(req.user._id, {
          personalizedPlan: recommendation,
          primaryGoal: userProfile.primaryGoal,
          goalPace: userProfile.goalPace,
          healthConditions: userProfile.healthConditions,
          foodPreferences: userProfile.foodPreferences,
          allergies: userProfile.allergies,
          lifestyle: userProfile.lifestyle,
          waistCm: userProfile.waistCm,
        });
      } catch (err) {
        console.warn('Could not auto-save plan to user document:', err);
      }
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Personalized diet recommendation generated successfully',
      data: recommendation,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to generate personalized diet recommendation'],
    });
  }
};

// @desc    Get food swap alternatives for a meal item
// @route   POST /api/diets/swap-food
exports.getFoodSwapAlternatives = async (req, res) => {
  try {
    const { foodId, allergies = [], dietType = 'balanced' } = req.body;
    if (!foodId) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Please provide a foodId to get swap alternatives'],
      });
    }

    const swaps = getFoodSwaps(foodId, allergies, dietType);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Food swap alternatives retrieved successfully',
      count: swaps.length,
      data: swaps,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve food swap alternatives'],
    });
  }
};

// @desc    Submit 2-3 week check-in metrics for adaptive plan adjustment
// @route   POST /api/diets/adaptive-review
exports.submitAdaptiveReview = async (req, res) => {
  try {
    const reviewInput = req.body;
    const reviewResult = reviewAdaptiveProgress(reviewInput);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Adaptive review completed successfully',
      data: reviewResult,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to review adaptive progress'],
    });
  }
};

// @desc    Get ranked diet recommendations for a user profile
// @route   GET /api/diets/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const user = req.user;
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

