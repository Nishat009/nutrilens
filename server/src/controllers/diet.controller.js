const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const {
  generatePersonalizedDietRecommendation,
  getFoodSwaps,
  reviewAdaptiveProgress,
} = require('../services/diet-recommendation-engine');
const mongoose = require('mongoose');

async function resolveUserId(rawId) {
  if (!rawId || rawId === 'current' || rawId === 'default' || !mongoose.Types.ObjectId.isValid(rawId)) {
    const defaultUser = await User.findOne();
    return defaultUser ? defaultUser._id : null;
  }
  return rawId;
}

// @desc    Get all diet plans
// @route   GET /api/diets
exports.getDiets = async (req, res) => {
  try {
    const diets = await DietPlan.find().sort({ isFeatured: -1, createdAt: 1 });
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Diet plans retrieved successfully',
      count: diets.length,
      data: diets,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve diet plans'],
    });
  }
};

// @desc    Get diet plan by slug
// @route   GET /api/diets/:slug
exports.getDietBySlug = async (req, res) => {
  try {
    const diet = await DietPlan.findOne({ slug: req.params.slug });
    if (!diet) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Diet plan not found'],
      });
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Diet plan retrieved successfully',
      data: diet,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve diet plan'],
    });
  }
};

// @desc    Adopt / select a diet plan for user
// @route   POST /api/diets/adopt
exports.adoptDiet = async (req, res) => {
  try {
    const { dietName } = req.body;

    if (!dietName) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Diet plan name is required'],
      });
    }

    const user = req.user;
    if (!user) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['User not found'],
      });
    }

    // Add to dietary preferences if not present
    if (!user.dietaryPreferences.includes(dietName)) {
      user.dietaryPreferences.push(dietName);
      await user.save();
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: `Diet protocol '${dietName}' adopted successfully`,
      data: user,
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
