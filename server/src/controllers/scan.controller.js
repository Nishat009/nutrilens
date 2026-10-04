const { sendError, sendUnexpectedError } = require('../utils/http');
const FoodScan = require('../models/FoodScan');
const { analyzeFoodImageServer } = require('../services/foodRecognitionService');
const { getUserConditions } = require('../services/user-profile');

// @desc    Analyze food photo using open food recognition model & calculate nutrition
// @route   POST /api/scans/analyze
exports.analyzeFoodScan = async (req, res) => {
  try {
    const { image, mealType, dominantColor, colorProfile, fileName } = req.body;

    if (!image) {
      return sendError(res, 422, ['Please provide an image for analysis']);
    }

    const result = await analyzeFoodImageServer(image, mealType, {
      dominantColor,
      colorProfile,
      fileName,
    });
    const scan = await FoodScan.create({
      userId: req.user._id,
      imageUrl: image,
      suggestedMealType: result.suggestedMealType,
      analysisNotes: result.analysisNotes,
      totalCalories: result.detectedFoods.reduce((sum, item) => sum + item.calories, 0),
      totalProtein: result.detectedFoods.reduce((sum, item) => sum + item.protein, 0),
      totalCarbs: result.detectedFoods.reduce((sum, item) => sum + item.carbs, 0),
      totalFat: result.detectedFoods.reduce((sum, item) => sum + item.fat, 0),
      totalFiber: result.detectedFoods.reduce((sum, item) => sum + item.fiber, 0),
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
    return sendUnexpectedError(res, error, 'Food analysis failed');
  }
};

// @desc    Get recent food scans for user
// @route   GET /api/scans
exports.getScans = async (req, res) => {
  try {
    const filter = { userId: req.user._id };

    const scans = await FoodScan.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Scans retrieved successfully',
      count: scans.length,
      data: scans,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to retrieve scans');
  }
};

// @desc    Get scan by ID
// @route   GET /api/scans/:id
exports.getScanById = async (req, res) => {
  try {
    const scan = await FoodScan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!scan) {
      return sendError(res, 404, 'Scan not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Scan details retrieved successfully',
      data: scan,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to retrieve scan');
  }
};

// @desc    Create or save new scan result
// @route   POST /api/scans
exports.createScan = async (req, res) => {
  try {
    const userId = req.user._id;

    const scan = await FoodScan.create({
      ...req.body,
      userId,
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Scan saved successfully',
      data: scan,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to save scan');
  }
};

// @desc    Teach the AI system by associating an image visual hash with a corrected/added vegetable
// @route   POST /api/scans/teach
exports.teachFoodScan = async (req, res) => {
  try {
    const LearnedFoodMatch = require('../models/LearnedFoodMatch');
    const { foodId, foodName, category, perceptualHash, colorSignature, sampleThumbnail } = req.body;

    if (!foodName || !perceptualHash) {
      return sendError(res, 422, ['Please provide both foodName and perceptualHash to teach the model']);
    }

    // Upsert or increment learned count if same hash exists
    let match = await LearnedFoodMatch.findOne({ perceptualHash });
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
    return sendUnexpectedError(res, error, 'Failed to save learned food association');
  }
};

// @desc    Get all learned visual associations
// @route   GET /api/scans/learned
exports.getLearnedMatches = async (req, res) => {
  try {
    const LearnedFoodMatch = require('../models/LearnedFoodMatch');
    const matches = await LearnedFoodMatch.find().sort({ updatedAt: -1 }).limit(200);

    res.status(200).json({
      success: true,
      code: 200,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to retrieve learned visual associations');
  }
};

// @desc    Evaluate scanned food against user profile, active diet, and medical safety
// @route   POST /api/scans/evaluate
exports.evaluateScanFood = async (req, res) => {
  try {
    const { evaluateFoodScan } = require('../services/nutrition-intelligence');
    let { foodName, foodId, portionG = 100, activeDiet, medicalConditions, allergies, medications } = req.body;

    // Fill in any context not passed explicitly from the authenticated user's profile
    const user = req.user;
    activeDiet = activeDiet || user.activeDietId || (user.dietaryPreferences && user.dietaryPreferences[0]);
    medicalConditions = medicalConditions || getUserConditions(user);
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
    return sendUnexpectedError(res, error, 'Failed to evaluate food safety');
  }
};



