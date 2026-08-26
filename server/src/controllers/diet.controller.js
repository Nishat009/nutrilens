const DietPlan = require('../models/DietPlan');
const User = require('../models/User');

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

const mongoose = require('mongoose');

async function resolveUserId(rawId) {
  if (!rawId || rawId === 'current' || rawId === 'default' || !mongoose.Types.ObjectId.isValid(rawId)) {
    const defaultUser = await User.findOne();
    return defaultUser ? defaultUser._id : null;
  }
  return rawId;
}

// @desc    Adopt / select a diet plan for user
// @route   POST /api/diets/adopt
exports.adoptDiet = async (req, res) => {
  try {
    let { userId, dietName } = req.body;
    userId = await resolveUserId(userId);

    if (!dietName) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Diet plan name is required'],
      });
    }

    const user = await User.findById(userId);
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
      errors: [error.message || 'Failed to adopt diet protocol'],
    });
  }
};
