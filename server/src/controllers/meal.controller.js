const mongoose = require('mongoose');
const Meal = require('../models/Meal');
const { sendError } = require('../utils/http');
const { sumNutrients } = require('../utils/nutrients');
const { MAX_SCAN_IMAGE_BYTES } = require('../config/app');

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 200;

// @desc    Get the signed-in member's meals (optionally for one date), newest first, one page at a time
//          (?page=1&limit=100, max 200). The photo is left out of the list; GET /api/meals/:id returns it.
// @route   GET /api/meals
exports.getMeals = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { userId: req.user._id };
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));

    if (date) {
      filter.date = String(date);
    }

    const [total, meals] = await Promise.all([
      Meal.countDocuments(filter),
      Meal.find(filter)
        .select('-imageUrl')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meals retrieved successfully',
      count: meals.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: meals,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve meals');
  }
};

// @desc    Get meal by ID
// @route   GET /api/meals/:id
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!meal) {
      return sendError(res, 'Meal not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal retrieved successfully',
      data: meal,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve meal details');
  }
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MAX_MEAL_ITEMS = 50;
const MAX_ITEM_VALUE = 10000; // per-item ceiling for quantity, calories and grams of a macro
const MAX_NOTES_LENGTH = 1000;

// A finite number in [0, max], or null when the value is missing or not numeric.
const boundedNumber = (value, max = MAX_ITEM_VALUE) => {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isFinite(number)) return null;
  return Math.min(max, Math.max(0, number));
};
const shortString = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const round1 = (value) => Math.round(value * 10) / 10;

// Whitelists each item's fields and checks their types, so only plain, bounded values reach the
// model. Returns { items } or { error }.
function sanitizeMealItems(rawItems) {
  if (rawItems === undefined || rawItems === null) return { items: [] };
  if (!Array.isArray(rawItems)) return { error: 'items must be an array' };
  if (rawItems.length > MAX_MEAL_ITEMS) return { error: `A meal can have at most ${MAX_MEAL_ITEMS} items` };

  const items = [];
  for (const [index, raw] of rawItems.entries()) {
    const label = `Item ${index + 1}`;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: `${label} must be an object` };
    const foodName = shortString(raw.foodName, 120);
    if (!foodName) return { error: `${label}: foodName is required` };
    const item = { foodName, unit: shortString(raw.unit, 20) || 'g' };
    for (const field of ['quantity', 'calories', 'protein', 'carbs', 'fat']) {
      const value = boundedNumber(raw[field]);
      if (value === null) return { error: `${label}: ${field} must be a number` };
      item[field] = value;
    }
    item.fiber = boundedNumber(raw.fiber) ?? 0;
    item.confidence = boundedNumber(raw.confidence, 1) ?? 1;
    if (typeof raw.foodId === 'string' && mongoose.isValidObjectId(raw.foodId)) item.foodId = raw.foodId;
    items.push(item);
  }
  return { items };
}

// @desc    Create new meal entry. Items are validated and the totals are always computed here from
//          the items; totals sent by the client are ignored.
// @route   POST /api/meals
exports.createMeal = async (req, res) => {
  try {
    const { type, date, time, imageUrl, notes } = req.body;
    const userId = req.user._id;
    if (imageUrl && (typeof imageUrl !== 'string' || imageUrl.length > MAX_SCAN_IMAGE_BYTES)) {
      return sendError(res, 'Meal photo is too large. Please upload a smaller photo.');
    }
    if (type !== undefined && !MEAL_TYPES.includes(type)) {
      return sendError(res, `type must be one of: ${MEAL_TYPES.join(', ')}`);
    }
    if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      return sendError(res, 'date must be YYYY-MM-DD');
    }
    if (time !== undefined && (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time))) {
      return sendError(res, 'time must be HH:mm');
    }
    if (notes !== undefined && typeof notes !== 'string') {
      return sendError(res, 'notes must be text');
    }

    const { items, error } = sanitizeMealItems(req.body.items);
    if (error) return sendError(res, error);
    const totals = sumNutrients(items);

    const meal = await Meal.create({
      userId,
      type: type || 'lunch',
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toTimeString().slice(0, 5),
      totalCalories: Math.round(totals.calories),
      totalProtein: round1(totals.protein),
      totalCarbs: round1(totals.carbs),
      totalFat: round1(totals.fat),
      totalFiber: round1(totals.fiber),
      items,
      imageUrl: imageUrl || '',
      notes: (notes || '').slice(0, MAX_NOTES_LENGTH),
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal created successfully',
      data: meal,
    });
  } catch (error) {
    sendError(res, error, 'Failed to create meal');
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!meal) {
      return sendError(res, 'Meal not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    sendError(res, error, 'Failed to delete meal');
  }
};
