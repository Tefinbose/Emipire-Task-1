const express = require("express");
const router = express.Router();

const {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount,
  validateCoupon,
} = require("../controllers/discountController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// 1. Public / Customer route: validate coupon code for cart
router.post("/validate", validateCoupon);

// 2. Admin routes: manage discounts and coupons
router.get("/", verifyToken, requireAdmin, getDiscounts);
router.post("/", verifyToken, requireAdmin, createDiscount);
router.get("/:id", verifyToken, requireAdmin, getDiscountById);
router.put("/:id", verifyToken, requireAdmin, updateDiscount);
router.patch("/:id/status", verifyToken, requireAdmin, toggleDiscountStatus);
router.delete("/:id", verifyToken, requireAdmin, deleteDiscount);

module.exports = router;
