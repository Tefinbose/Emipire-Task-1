const express = require("express");
const router = express.Router();

const {
  getGiftCards,
  createGiftCard,
  checkGiftCardBalance,
  updateGiftCardStatus,
} = require("../controllers/giftCardController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Public route: check gift card balance
router.post("/check-balance", checkGiftCardBalance);

// Admin routes: manage gift cards
router.get("/", verifyToken, requireAdmin, getGiftCards);
router.post("/", verifyToken, requireAdmin, createGiftCard);
router.patch("/:id/status", verifyToken, requireAdmin, updateGiftCardStatus);

module.exports = router;
