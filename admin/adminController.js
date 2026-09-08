const User = require('../models/User');
const Category = require('../models/Category');
const Shipment = require('../models/Shipment');
const Seller = require('../models/Seller');

// Dashboard Metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalCategories = await Category.countDocuments();
    const totalShipments = await Shipment.countDocuments();
    const pendingShipments = await Shipment.countDocuments({ status: 'Processing' });
    const deliveredShipments = await Shipment.countDocuments({ status: 'Delivered' });

    res.status(200).json({
      success: true,
      metrics: { totalUsers, totalSellers, totalCustomers, totalCategories, totalShipments, pendingShipments, deliveredShipments }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// User Management CRUD & Roles
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({ success: true, users });
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'seller', 'customer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }
  const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  res.status(200).json({ success: true, updatedUser });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'User deleted successfully.' });
};

// Category Management
exports.createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
};

exports.updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json({ success: true, category });
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Category removed.' });
};

// Shipment Management
exports.getAllShipments = async (req, res) => {
  const shipments = await Shipment.find().populate('customer seller');
  res.status(200).json({ success: true, shipments });
};

exports.updateShipmentStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid shipment status.' });
  }
  const shipment = await Shipment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.status(200).json({ success: true, shipment });
};

// Seller Override Logic
exports.getSellerDashboard = async (req, res) => {
  try {
    let targetSellerId;
    if (req.query.seller_id) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: Only admins can view other sellers accounts.' });
      }
      targetSellerId = req.query.seller_id;
    } else {
      if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized.' });
      }
      targetSellerId = req.user.id;
    }

    const sellerData = await Seller.findOne({ userId: targetSellerId }).populate('products');
    if (!sellerData) return res.status(404).json({ error: 'Seller profile not found.' });

    res.status(200).json({ success: true, data: sellerData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};