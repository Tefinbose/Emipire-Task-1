
const express = require("express");
const router = express.Router();

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

const {
  getDashboardStats,
} = require("../controllers/dashboardController");

router.get("/stats", verifyToken, requireAdmin, getDashboardStats);

module.exports = router;
