// Admin panel API. Every route: requireAuth + requireAdmin. Every write also: blockDemoWrites
// (the shared demo admin is read-only and sees real members masked). Checked by tests/route-guards.test.js.
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, blockDemoWrites } = require('../middleware/auth');
const {
  getOverview,
  listUsers,
  getUser,
  updateUserRole,
  deleteUser,
  listScans,
  listDiets,
  listCatalog,
  updateVegetable,
} = require('../controllers/admin.controller');

router.use(requireAuth, requireAdmin);

router.get('/overview', getOverview);
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', blockDemoWrites, updateUserRole);
router.delete('/users/:id', blockDemoWrites, deleteUser);
router.get('/scans', listScans);
router.get('/diets', listDiets);
router.get('/catalog', listCatalog);
router.patch('/vegetables/:id', blockDemoWrites, updateVegetable);

module.exports = router;
