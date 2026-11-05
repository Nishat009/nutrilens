const Food = require('../models/Food');
const { escapeRegex } = require('../utils/regex');
const { sendError } = require('../utils/http');

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Fields an admin may set on a new food; `_id` and timestamps stay server-controlled.
const FOOD_FIELDS = [...new Set(Object.keys(Food.schema.paths).map((path) => path.split('.')[0]))]
  .filter((field) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(field));

// @desc    Get foods, optionally filtered by category or search text (?page=1&limit=50, max 100)
// @route   GET /api/foods
exports.getFoods = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));

    if (category) {
      query.category = String(category);
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { name: pattern },
        { category: pattern },
        { tags: pattern },
      ];
    }

    const [total, foods] = await Promise.all([
      Food.countDocuments(query),
      Food.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Foods retrieved successfully',
      count: foods.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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
    const fields = Object.fromEntries(FOOD_FIELDS.filter((key) => key in req.body).map((key) => [key, req.body[key]]));
    const food = await Food.create(fields);
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
