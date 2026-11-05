const FoodScan = require('../models/FoodScan');
const { analyzeFoodImageServer } = require('../services/foodRecognitionService');
const { sendError } = require('../utils/http');
const { sumNutrients } = require('../utils/nutrients');
const { MAX_SCAN_IMAGE_BYTES } = require('../config/app');

const SCAN_FIELDS = ['status', 'suggestedMealType', 'analysisNotes', 'totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'totalFiber', 'detectedItems'];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Scan photos arrive as data URLs (downscaled in the browser) or hosted links; oversized ones are refused.
const checkImage = (image) => {
  if (typeof image !== 'string' || !image) return 'Please provide an image for analysis';
  if (image.length > MAX_SCAN_IMAGE_BYTES) {
    return `Image is too large (max ${Math.round(MAX_SCAN_IMAGE_BYTES / 1024 / 1024)} MB). Please upload a smaller photo.`;
  }
  return null;
};

// @desc    Analyze food photo using open food recognition model & calculate nutrition
// @route   POST /api/scans/analyze
exports.analyzeFoodScan = async (req, res) => {
  try {
    const { image, mealType, dominantColor, colorProfile, fileName } = req.body;

    const imageError = checkImage(image);
    if (imageError) return sendError(res, imageError);

    const result = await analyzeFoodImageServer(image, mealType, {
      dominantColor,
      colorProfile,
      fileName,
    });
    const totals = sumNutrients(result.detectedFoods);
    const scan = await FoodScan.create({
      userId: req.user._id,
      imageUrl: image,
      suggestedMealType: result.suggestedMealType,
      analysisNotes: result.analysisNotes,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      detectedItems: result.detectedFoods.map((item) => ({
        name: item.name,
        confidence: item.confidence,
        estimatedQuantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        foodId: item.foodId,
      })),
    });
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Food analysis completed successfully',
      data: { ...result, persistedScanId: scan._id },
    });
  } catch (error) {
    sendError(res, error, 'Food analysis failed');
  }
};

// @desc    Get the signed-in member's recent food scans, newest first, one page at a time
//          (?page=1&limit=20, max 50). The photo is left out of the list; GET /api/scans/:id returns it.
// @route   GET /api/scans
exports.getScans = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));

    const [total, scans] = await Promise.all([
      FoodScan.countDocuments(filter),
      FoodScan.find(filter)
        .select('-imageUrl')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Scans retrieved successfully',
      count: scans.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: scans,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve scans');
  }
};

// @desc    Get scan by ID
// @route   GET /api/scans/:id
exports.getScanById = async (req, res) => {
  try {
    const scan = await FoodScan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!scan) {
      return sendError(res, 'Scan not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Scan details retrieved successfully',
      data: scan,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve scan');
  }
};

// @desc    Create or save new scan result
// @route   POST /api/scans
exports.createScan = async (req, res) => {
  try {
    const imageError = checkImage(req.body.imageUrl);
    if (imageError) return sendError(res, imageError);

    // Only known scan fields are copied; userId always comes from the session.
    const fields = {};
    for (const field of SCAN_FIELDS) {
      if (req.body[field] !== undefined) fields[field] = req.body[field];
    }
    const scan = await FoodScan.create({ ...fields, imageUrl: req.body.imageUrl, userId: req.user._id });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Scan saved successfully',
      data: scan,
    });
  } catch (error) {
    sendError(res, error, 'Failed to save scan');
  }
};

// @desc    Teach the AI system by associating an image visual hash with a corrected/added vegetable
// @route   POST /api/scans/teach
exports.teachFoodScan = async (req, res) => {
  try {
    const LearnedFoodMatch = require('../models/LearnedFoodMatch');
    const { foodId, foodName, category, perceptualHash, colorSignature, sampleThumbnail } = req.body;

    if (!foodName || !perceptualHash) {
      return sendError(res, 'Please provide both foodName and perceptualHash to teach the model');
    }

    // Upsert or increment learned count if same hash exists
    let match = await LearnedFoodMatch.findOne({ perceptualHash, userId: req.user._id });
    if (match) {
      match.foodId = foodId || match.foodId;
      match.foodName = foodName;
      match.category = category || match.category;
      match.learnedCount += 1;
      if (colorSignature) match.colorSignature = colorSignature;
      if (sampleThumbnail) match.sampleThumbnail = sampleThumbnail;
      await match.save();
    } else {
      match = await LearnedFoodMatch.create({
        userId: req.user._id,
        foodId: foodId || `custom_${Date.now()}`,
        foodName,
        category: category || 'Vegetables',
        perceptualHash,
        colorSignature: colorSignature || [],
        sampleThumbnail: sampleThumbnail || '',
        learnedCount: 1,
      });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: `Successfully learned visual association for "${foodName}". Future scans of this image will match automatically.`,
      data: match,
    });
  } catch (error) {
    sendError(res, error, 'Failed to save learned food association');
  }
};

// @desc    Get the signed-in member's learned visual associations
// @route   GET /api/scans/learned
exports.getLearnedMatches = async (req, res) => {
  try {
    const LearnedFoodMatch = require('../models/LearnedFoodMatch');
    const matches = await LearnedFoodMatch.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(200);

    res.status(200).json({
      success: true,
      code: 200,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve learned visual associations');
  }
};

// @desc    Evaluate scanned food against user profile, active diet, and medical safety
// @route   POST /api/scans/evaluate
exports.evaluateScanFood = async (req, res) => {
  try {
    const { evaluateFoodScan } = require('../services/nutrition-intelligence');
    let { foodName, foodId, portionG = 100, activeDiet, medicalConditions, allergies, medications } = req.body;

    // Fill missing context from the signed-in member's own profile (never from a body-supplied user id).
    const user = req.user;
    activeDiet = activeDiet || user.activeDietId || (user.dietaryPreferences && user.dietaryPreferences[0]);
    medicalConditions = medicalConditions || user.medicalConditions;
    allergies = allergies || user.allergies;
    medications = medications || user.medications;

    const evaluation = evaluateFoodScan(foodId || foodName, portionG, {
      activeDiet,
      medicalConditions,
      allergies,
      medications,
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Food clinical evaluation completed',
      data: evaluation,
    });
  } catch (error) {
    sendError(res, error, 'Failed to evaluate food safety');
  }
};



