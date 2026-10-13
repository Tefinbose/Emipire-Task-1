const express = require("express");
const router = express.Router();

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

const {
  getDashboardStats,
  getAnalyticsData,
} = require("../controllers/dashboardController");

// Dashboard summary stats
router.get("/stats", verifyToken, requireAdmin, getDashboardStats);

// Comprehensive store analytics
router.get("/analytics", verifyToken, requireAdmin, getAnalyticsData);

module.exports = router;
