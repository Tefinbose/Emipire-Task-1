
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

const { protectAdmin } = require("../middleware/adminMiddleware");

// User routes
router.post("/", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getMyOrders);

// Admin routes
router.get("/", verifyToken, requireAdmin, getOrders);

// Get a single order
router.get("/:id", protectAdmin, getOrderById);

// Update order status
router.patch("/:id/status", protectAdmin, updateOrderStatus);

// Cancel order
router.patch("/:id/cancel", protectAdmin, cancelOrder);

module.exports = router;