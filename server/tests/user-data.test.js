// Every model with a userId field must be cleaned up when a member is deleted
// (services/user-data.js), so a new member-scoped model cannot be forgotten.
// Usage: npm run test:unit
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { USER_SCOPED_MODELS } = require('../src/services/user-data');

const modelsDir = path.join(__dirname, '..', 'src', 'models');
const scoped = new Set(USER_SCOPED_MODELS.map((Model) => Model.modelName));
let checked = 0;

for (const file of fs.readdirSync(modelsDir).filter((name) => name.endsWith('.js'))) {
  const Model = require(path.join(modelsDir, file));
  if (!Model?.schema || Model.modelName === 'User') continue;
  if (Model.schema.path('userId')) {
    assert.ok(scoped.has(Model.modelName), `${Model.modelName} has a userId but is missing from USER_SCOPED_MODELS in src/services/user-data.js`);
    checked += 1;
  }
}

assert.equal(checked, scoped.size, 'USER_SCOPED_MODELS lists a model without a userId field');
console.log(`User data cleanup test passed: ${checked} member-scoped models are deleted with the member.`);
