
const express = require("express");
const router = express.Router();

const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

const { protectAdmin } = require("../middleware/adminMiddleware");

// Get all orders
router.get("/", protectAdmin, getOrders);

// Get a single order
router.get("/:id", protectAdmin, getOrderById);

// Update order status
router.patch("/:id/status", protectAdmin, updateOrderStatus);

// Cancel order
router.patch("/:id/cancel", protectAdmin, cancelOrder);

module.exports = router;
