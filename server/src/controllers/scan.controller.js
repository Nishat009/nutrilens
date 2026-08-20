const FoodScan = require('../models/FoodScan');
const User = require('../models/User');
const { analyzeFoodImageServer } = require('../services/foodRecognitionService');

// @desc    Analyze food photo using open food recognition model & calculate nutrition
// @route   POST /api/scans/analyze
exports.analyzeFoodScan = async (req, res) => {
  try {
    const { image, mealType } = req.body;

    if (!image) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Please provide an image for analysis'],
      });
    }

    const result = await analyzeFoodImageServer(image, mealType);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Food analysis completed successfully',
      result,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Food analysis failed'],
    });
  }
};

// @desc    Get recent food scans for user
// @route   GET /api/scans
exports.getScans = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;

    const scans = await FoodScan.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Scans retrieved successfully',
      count: scans.length,
      data: scans,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve scans'],
    });
  }
};

// @desc    Get scan by ID
// @route   GET /api/scans/:id
exports.getScanById = async (req, res) => {
  try {
    const scan = await FoodScan.findById(req.params.id);
    if (!scan) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Scan not found'],
      });
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Scan details retrieved successfully',
      data: scan,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve scan'],
    });
  }
};

// @desc    Create or save new scan result
// @route   POST /api/scans
exports.createScan = async (req, res) => {
  try {
    let { userId } = req.body;
    if (!userId) {
      const defaultUser = await User.findOne();
      if (defaultUser) userId = defaultUser._id;
    }

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
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'Failed to save scan'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};
