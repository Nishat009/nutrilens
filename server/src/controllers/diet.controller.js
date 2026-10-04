const { sendError, sendUnexpectedError } = require('../utils/http');
const {
  generatePersonalizedDietRecommendation,
  getFoodSwaps,
  reviewAdaptiveProgress,
} = require('../services/diet-recommendation-engine');
const { rankDietProtocols } = require('../services/diet-ranking');
const {
  CANONICAL_DIETS,
  resolveDietPlan,
  validateDietAdoption,
  calculatePersonalizedTargets,
} = require('../services/nutrition-intelligence');

// The canonical catalog (server/src/nutrition/diet-plans.json) is the single
// source of truth for diet protocols; it is static, so it isn't stored in MongoDB.

// @desc    Get all diet plans (Canonical 20)
// @route   GET /api/diets
exports.getDiets = (req, res) => {
  res.status(200).json({
    success: true,
    code: 200,
    count: CANONICAL_DIETS.length,
    data: CANONICAL_DIETS,
  });
};

// @desc    Get diet plan by slug or canonical ID
// @route   GET /api/diets/:slug
exports.getDietBySlug = async (req, res) => {
  try {
    const diet = resolveDietPlan(req.params.slug);
    if (!diet) return sendError(res, 404, 'Diet protocol not found');
    res.status(200).json({ success: true, code: 200, message: 'Diet protocol retrieved successfully', data: diet });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to retrieve diet protocol');
  }
};

// @desc    Adopt / select a diet plan for user
// @route   POST /api/diets/adopt
exports.adoptDiet = async (req, res) => {
  try {
    const { dietName, dietId } = req.body;

    const targetIdentifier = dietId || dietName;
    if (!targetIdentifier) {
      return sendError(res, 422, ['Diet identifier (id, slug, or name) is required']);
    }

    const user = req.user;
    if (!user) {
      return sendError(res, 404, 'User profile not found');
    }

    // Step 1: Safety & Eligibility Validation
    const validation = validateDietAdoption(user, targetIdentifier);
    if (!validation.dietPlan && validation.status === 'error') {
      return sendError(res, 404, 'Diet protocol not found');
    }
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
    return sendUnexpectedError(res, error, 'Failed to adopt diet plan');
  }
};

// @desc    Generate a complete personalized diet recommendation & 7-day meal plan
// @route   POST /api/diets/recommend
exports.getPersonalizedRecommendation = async (req, res) => {
  try {
    // Assessment answers in the body override what is stored on the profile.
    // The caller persists the plan (onboarding saves it with the full assessment).
    const userProfile = { ...req.user.toObject(), ...(req.body || {}) };
    const recommendation = generatePersonalizedDietRecommendation(userProfile);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Personalized diet recommendation generated successfully',
      data: recommendation,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to generate personalized diet recommendation');
  }
};

// @desc    Get food swap alternatives for a meal item
// @route   POST /api/diets/swap-food
exports.getFoodSwapAlternatives = async (req, res) => {
  try {
    const { foodId, allergies = [], dietType = 'balanced' } = req.body;
    if (!foodId) {
      return sendError(res, 422, ['Please provide a foodId to get swap alternatives']);
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
    return sendUnexpectedError(res, error, 'Failed to retrieve food swap alternatives');
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
    return sendUnexpectedError(res, error, 'Failed to review adaptive progress');
  }
};

// @desc    Get ranked diet recommendations for a user profile
// @route   GET /api/diets/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Personalized diet recommendations calculated',
      data: rankDietProtocols(req.user.toObject()),
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to calculate diet recommendations');
  }
};

