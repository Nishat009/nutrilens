require('dotenv').config();
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { getUserProfile, updateUserProfile } = require('../src/controllers/user.controller');
const { requireSelf } = require('../src/middleware/auth');
const { randomPassword } = require('./lib/http-helpers');

async function invoke(handler, user, id, body = {}) {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
  await handler({ user, params: { id }, body }, response);
  return response;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  let testUser;
  const originalPassword = randomPassword();
  try {
    testUser = await User.create({
      name: 'Persistence Test',
      email: `persistence-${crypto.randomUUID()}@example.com`,
      password: originalPassword,
    });
    const answer = await invoke(updateUserProfile, testUser, 'current', {
      name: 'Saved Assessment',
      primaryGoal: 'gain_muscle',
      healthConditions: ['none'],
      personalizedPlan: { selectedDiet: { name: 'Test Plan' } },
      onboardingCompleted: true,
      goal: { type: 'gain_muscle', targetCalories: 2400 },
      password: randomPassword(),
    });
    assert.equal(answer.statusCode, 200);
    assert.equal(answer.body.data.password, undefined);
    const reloaded = await User.findById(testUser._id).select('+password');
    assert.equal(reloaded.name, 'Saved Assessment');
    assert.equal(reloaded.goal.targetCalories, 2400);
    assert.equal(reloaded.personalizedPlan.selectedDiet.name, 'Test Plan');
    assert.equal(reloaded.onboardingCompleted, true);
    assert.equal(reloaded.password, originalPassword);
    const read = await invoke(getUserProfile, reloaded, 'current');
    assert.equal(read.statusCode, 200);
    assert.equal(read.body.data.password, undefined);
    // Another member's id is refused by requireSelf before the handler runs.
    const forbidden = await invoke(requireSelf, reloaded, new mongoose.Types.ObjectId().toString());
    assert.equal(forbidden.statusCode, 403);
    console.log('MongoDB profile and goal persistence round trip passed.');
  } finally {
    if (testUser) await User.deleteOne({ _id: testUser._id });
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
