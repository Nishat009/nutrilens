// Deleting a member. MongoDB has no foreign keys, so the cascade the SQL view documents
// (ON DELETE CASCADE in database/schema.sql) is done here: every collection with a userId.
// Add a new member-scoped model to USER_SCOPED_MODELS.
const Meal = require('../models/Meal');
const FoodScan = require('../models/FoodScan');
const WeightLog = require('../models/WeightLog');
const PlannedMeal = require('../models/PlannedMeal');
const LearnedFoodMatch = require('../models/LearnedFoodMatch');

const USER_SCOPED_MODELS = [Meal, FoodScan, WeightLog, PlannedMeal, LearnedFoodMatch];

// Removes the member's data in every scoped collection, then the member.
async function deleteUserAndData(user) {
  const userId = user._id;
  await Promise.all(USER_SCOPED_MODELS.map((Model) => Model.deleteMany({ userId })));
  await user.deleteOne();
}

module.exports = { USER_SCOPED_MODELS, deleteUserAndData };
