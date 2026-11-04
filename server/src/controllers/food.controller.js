const Food = require('../models/Food');
const { escapeRegex } = require('../utils/regex');
const { sendError } = require('../utils/http');

// @desc    Get all foods or filter by category
// @route   GET /api/foods
exports.getFoods = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { name: pattern },
        { category: pattern },
        { tags: pattern },
      ];
    }

    const foods = await Food.find(query).sort({ name: 1 });
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Foods retrieved successfully',
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve food items');
  }
};

// @desc    Get food by ID
// @route   GET /api/foods/:id
exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return sendError(res, 'Food item not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Food item retrieved successfully',
      data: food,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve food item');
  }
};

// @desc    Create new food item
// @route   POST /api/foods
exports.createFood = async (req, res) => {
  try {
    const food = await Food.create(req.body);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Food item created successfully',
      data: food,
    });
  } catch (error) {
    sendError(res, error, 'Failed to create food item');
  }
};
