
const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// User routes
router.post("/", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getMyOrders);

// Admin routes
router.get("/", verifyToken, requireAdmin, getOrders);

// Get a single order
router.get("/:id", verifyToken, requireAdmin, getOrderById);

// Update order status
router.patch("/:id/status", verifyToken, requireAdmin, updateOrderStatus);

// Cancel order
router.patch("/:id/cancel", verifyToken, requireAdmin, cancelOrder);

module.exports = router;