const express = require("express");
const router = express.Router();

const {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
} = require("../controllers/customerController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// All customer management endpoints require Admin authentication
router.use(verifyToken, requireAdmin);

// 1. Get all customers with search, status filters and order stats
router.get("/", getCustomers);

// 2. Get single customer profile and order history
router.get("/:id", getCustomerById);

// 3. Update customer account status (active / blocked)
router.patch("/:id/status", updateCustomerStatus);

module.exports = router;
