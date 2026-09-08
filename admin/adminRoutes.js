const express = require('express');
const router = express.Router();
const { verifyAdminToken, verifySellerOrAdmin } = require('../middleware/adminAuth');
const {
  getDashboardMetrics,
  getAllUsers,
  updateUserRole,
  deleteUser,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllShipments,
  updateShipmentStatus,
  getSellerDashboard
} = require('../controllers/adminController');

router.get('/dashboard/metrics', verifyAdminToken, getDashboardMetrics);
router.get('/users', verifyAdminToken, getAllUsers);
router.put('/users/:id/role', verifyAdminToken, updateUserRole);
router.delete('/users/:id', verifyAdminToken, deleteUser);

router.post('/categories', verifyAdminToken, createCategory);
router.put('/categories/:id', verifyAdminToken, updateCategory);
router.delete('/categories/:id', verifyAdminToken, deleteCategory);

router.get('/shipments', verifyAdminToken, getAllShipments);
router.put('/shipments/:id/status', verifyAdminToken, updateShipmentStatus);

router.get('/seller/dashboard', verifySellerOrAdmin, getSellerDashboard);

module.exports = router;