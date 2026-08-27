const mongoose = require('mongoose');
const Vegetable = require('../models/Vegetable');
const { VEGETABLES_DATA } = require('../data/vegetables-data');

/**
 * Normalization helper for fuzzy & alias vegetable matching
 */
function normalizeQuery(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');
}

// @desc    Get all vegetables with filtering, category, sorting, and pagination
// @route   GET /api/vegetables
exports.getVegetables = async (req, res) => {
  try {
    const { category, search, sortBy = 'name', order = 'asc', page = 1, limit = 50 } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let filtered = [...VEGETABLES_DATA];
      if (category && category !== 'All') {
        filtered = filtered.filter((v) => v.category === category);
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(
          (v) =>
            v.name?.toLowerCase().includes(q) ||
            v.bengaliName?.includes(q) ||
            v.scientificName?.toLowerCase().includes(q) ||
            v.category?.toLowerCase().includes(q)
        );
      }
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(150, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;
      const paginated = filtered.slice(skip, skip + limitNum);
      const categories = [...new Set(VEGETABLES_DATA.map((v) => v.category).filter(Boolean))];

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Vegetables retrieved (offline fallback mode)',
        count: paginated.length,
        total: filtered.length,
        page: pageNum,
        totalPages: Math.ceil(filtered.length / limitNum),
        categories,
        data: paginated,
      });
    }

    const filter = { isActive: true };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');

      filter.$or = [
        { name: regex },
        { slug: regex },
        { aliases: { $in: [regex] } },
        { scientificName: regex },
        { category: regex },
      ];
    }

    const sortOptions = {};
    const sortFieldMap = {
      name: 'name',
      calories: 'caloriesPer100g',
      protein: 'proteinPer100g',
      carbs: 'carbsPer100g',
      fiber: 'fiberPer100g',
      fat: 'fatPer100g',
    };
    const targetField = sortFieldMap[sortBy] || 'name';
    sortOptions[targetField] = order === 'desc' ? -1 : 1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(150, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [vegetables, totalCount, categories] = await Promise.all([
      Vegetable.find(filter).sort(sortOptions).skip(skip).limit(limitNum),
      Vegetable.countDocuments(filter),
      Vegetable.distinct('category', { isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Vegetables retrieved successfully',
      count: vegetables.length,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      categories,
      data: vegetables,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve vegetables'],
    });
  }
};

// @desc    Fast search vegetables by name, aliases, Bengali/regional names, or slug
// @route   GET /api/vegetables/search
exports.searchVegetables = async (req, res) => {
  try {
    const queryStr = req.query.q || req.query.search || '';
    if (!queryStr || !queryStr.trim()) {
      return res.status(200).json({
        success: true,
        code: 200,
        count: 0,
        data: [],
      });
    }

    const cleanQuery = queryStr.trim();
    const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const exactRegex = new RegExp(`^${escaped}$`, 'i');

    // Search query
    const results = await Vegetable.find({
      isActive: true,
      $or: [
        { name: regex },
        { slug: regex },
        { aliases: { $in: [regex] } },
        { scientificName: regex },
        { description: regex },
      ],
    }).limit(30);

    // Rank results: exact name > exact alias > prefix name > substring
    const ranked = results.sort((a, b) => {
      const aNameExact = exactRegex.test(a.name);
      const bNameExact = exactRegex.test(b.name);
      if (aNameExact && !bNameExact) return -1;
      if (!aNameExact && bNameExact) return 1;

      const aAliasExact = a.aliases.some((al) => exactRegex.test(al));
      const bAliasExact = b.aliases.some((al) => exactRegex.test(al));
      if (aAliasExact && !bAliasExact) return -1;
      if (!aAliasExact && bAliasExact) return 1;

      const aNamePrefix = a.name.toLowerCase().startsWith(cleanQuery.toLowerCase());
      const bNamePrefix = b.name.toLowerCase().startsWith(cleanQuery.toLowerCase());
      if (aNamePrefix && !bNamePrefix) return -1;
      if (!aNamePrefix && bNamePrefix) return 1;

      return a.name.localeCompare(b.name);
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Vegetable search completed',
      count: ranked.length,
      query: cleanQuery,
      data: ranked,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Vegetable search failed'],
    });
  }
};

// @desc    Get vegetable by ID or Slug
// @route   GET /api/vegetables/:idOrSlug
exports.getVegetableByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let vegetable = null;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      vegetable = await Vegetable.findById(idOrSlug);
    }

    if (!vegetable) {
      vegetable = await Vegetable.findOne({
        $or: [
          { slug: idOrSlug.toLowerCase() },
          { name: new RegExp(`^${idOrSlug}$`, 'i') },
        ],
      });
    }

    if (!vegetable) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: [`Vegetable '${idOrSlug}' not found in database`],
      });
    }


    res.status(200).json({
      success: true,
      code: 200,
      message: 'Vegetable retrieved successfully',
      data: vegetable,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve vegetable'],
    });
  }
};

// @desc    Match detected food names from image recognition to Vegetable Database
// @route   POST /api/vegetables/match
exports.matchVegetables = async (req, res) => {
  try {
    const { detectedNames = [], name } = req.body;
    const namesToMatch = Array.isArray(detectedNames) && detectedNames.length > 0
      ? detectedNames
      : name
      ? [name]
      : [];

    if (namesToMatch.length === 0) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Please provide at least one vegetable name or label to match'],
      });
    }

    const allVegetables = await Vegetable.find({ isActive: true });
    const matches = [];

    for (const rawName of namesToMatch) {
      const normalized = normalizeQuery(rawName);
      if (!normalized) continue;

      let bestMatch = null;
      let highestScore = 0;
      let matchType = 'none';

      for (const veg of allVegetables) {
        const vegNameNorm = normalizeQuery(veg.name);
        const vegSlugNorm = normalizeQuery(veg.slug);
        const aliasNorms = (veg.aliases || []).map(normalizeQuery);

        // 1. Exact name or slug match (1.0)
        if (vegNameNorm === normalized || vegSlugNorm === normalized) {
          bestMatch = veg;
          highestScore = 1.0;
          matchType = 'exact_name';
          break;
        }

        // 2. Exact alias match (0.98)
        if (aliasNorms.includes(normalized)) {
          if (highestScore < 0.98) {
            bestMatch = veg;
            highestScore = 0.98;
            matchType = 'exact_alias';
          }
        }

        // 3. Substring / Word match (0.85 - 0.92)
        if (vegNameNorm.includes(normalized) || normalized.includes(vegNameNorm)) {
          const score = 0.90;
          if (score > highestScore) {
            bestMatch = veg;
            highestScore = score;
            matchType = 'partial_name';
          }
        }

        // 4. Alias Substring match (0.80)
        for (const al of aliasNorms) {
          if (al.includes(normalized) || normalized.includes(al)) {
            const score = 0.82;
            if (score > highestScore) {
              bestMatch = veg;
              highestScore = score;
              matchType = 'partial_alias';
            }
          }
        }
      }

      // Confidence grading
      let confidenceLevel = 'low';
      if (highestScore >= 0.90) confidenceLevel = 'high';
      else if (highestScore >= 0.70) confidenceLevel = 'medium';

      matches.push({
        query: rawName,
        matched: bestMatch !== null,
        confidence: Math.round(highestScore * 100) / 100,
        confidenceLevel,
        matchType,
        vegetable: bestMatch,
      });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Vegetable matching completed',
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Vegetable matching failed'],
    });
  }
};

// @desc    Calculate exact proportional nutrition for custom gram weight
// @route   POST /api/vegetables/:idOrSlug/calculate
exports.calculateNutrition = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const { quantityGrams = 100 } = req.body;

    const grams = Math.max(1, parseFloat(quantityGrams) || 100);

    let vegetable = null;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      vegetable = await Vegetable.findById(idOrSlug);
    }
    if (!vegetable) {
      vegetable = await Vegetable.findOne({
        $or: [
          { slug: idOrSlug.toLowerCase() },
          { name: new RegExp(`^${idOrSlug}$`, 'i') },
        ],
      });
    }

    if (!vegetable) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: [`Vegetable '${idOrSlug}' not found`],
      });
    }


    const factor = grams / 100;
    const calculated = {
      vegetableId: vegetable._id,
      name: vegetable.name,
      slug: vegetable.slug,
      portionGrams: grams,
      unit: 'g',
      preparationState: vegetable.preparationState,
      standardNotice: 'Based on raw edible portion per 100g — USDA FoodData Central',
      nutrition: {
        calories: Math.round(vegetable.caloriesPer100g * factor * 10) / 10,
        protein: Math.round(vegetable.proteinPer100g * factor * 10) / 10,
        carbs: Math.round(vegetable.carbsPer100g * factor * 10) / 10,
        fat: Math.round(vegetable.fatPer100g * factor * 10) / 10,
        fiber: Math.round(vegetable.fiberPer100g * factor * 10) / 10,
        sugar: Math.round(vegetable.sugarPer100g * factor * 10) / 10,
        sodiumMg: Math.round(vegetable.sodiumMg * factor * 10) / 10,
        potassiumMg: Math.round(vegetable.potassiumMg * factor * 10) / 10,
        vitaminCMg: Math.round(vegetable.vitaminCMg * factor * 10) / 10,
        vitaminAIU: Math.round(vegetable.vitaminAIU * factor),
        calciumMg: Math.round(vegetable.calciumMg * factor * 10) / 10,
        ironMg: Math.round(vegetable.ironMg * factor * 10) / 10,
      },
      source: vegetable.source,
      sourceReference: vegetable.sourceReference,
    };

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Nutrition calculated successfully',
      data: calculated,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to calculate nutrition'],
    });
  }
};

// @desc    Get vegetable categories summary
// @route   GET /api/vegetables/categories
exports.getCategories = async (req, res) => {
  try {
    const summary = await Vegetable.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      code: 200,
      data: summary.map((s) => ({ category: s._id, count: s.count })),
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve categories'],
    });
  }
};
