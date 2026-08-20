const Food = require('../models/Food');

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
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
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
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve food items'],
    });
  }
};

// @desc    Get food by ID
// @route   GET /api/foods/:id
exports.getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Food item not found'],
      });
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Food item retrieved successfully',
      data: food,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve food item'],
    });
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
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'Failed to create food item'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};
