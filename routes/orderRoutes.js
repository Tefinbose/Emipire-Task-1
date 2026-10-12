
const express = require("express");
const router = express.Router();

const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Admin-only routes
router.get("/", verifyToken, requireAdmin, getOrders);

router.get("/:id", verifyToken, requireAdmin, getOrderById);

router.patch(
  "/:id/status",
  verifyToken,
  requireAdmin,
  updateOrderStatus
);

router.patch(
  "/:id/cancel",
  verifyToken,
  requireAdmin,
  cancelOrder
);

module.exports = router;
