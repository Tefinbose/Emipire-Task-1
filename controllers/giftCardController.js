const crypto = require("crypto");
const mongoose = require("mongoose");
const GiftCard = require("../models/GiftCard");

// Helper to generate a random 16-character alphanumeric gift card code
const generateCardCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable chars without ambiguous 0/O, 1/I
  let result = "";
  for (let i = 0; i < 16; i++) {
    const randByte = crypto.randomBytes(1)[0];
    result += chars[randByte % chars.length];
  }
  return result.match(/.{1,4}/g).join("-");
};

// 1. Get all gift cards (Admin)
const getGiftCards = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { maskedCode: regex },
        { recipientEmail: regex },
        { recipientName: regex },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [giftCards, total] = await Promise.all([
      GiftCard.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("customer", "name email phone"),
      GiftCard.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: giftCards.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      giftCards,
    });
  } catch (error) {
    console.error("Get gift cards error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gift cards",
    });
  }
};

// 2. Issue / Create a new gift card (Admin)
const createGiftCard = async (req, res) => {
  try {
    const {
      initialValue,
      currency = "INR",
      recipientEmail,
      recipientName,
      message,
      expiresAt,
      notes,
    } = req.body;

    if (!initialValue || Number(initialValue) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid initial value greater than 0 is required",
      });
    }

    const val = Number(initialValue);
    const code = generateCardCode();
    const last4 = code.slice(-4);
    const maskedCode = `•••• •••• •••• ${last4}`;

    const giftCard = await GiftCard.create({
      code,
      maskedCode,
      initialValue: val,
      balance: val,
      currency: currency.toUpperCase(),
      recipientEmail: recipientEmail?.trim() || "",
      recipientName: recipientName?.trim() || "",
      message: message || "",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes: notes || "",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Gift card issued successfully",
      giftCard: {
        ...giftCard.toObject(),
        fullCode: code, // Only exposed upon creation
      },
    });
  } catch (error) {
    console.error("Create gift card error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to issue gift card",
    });
  }
};

// 3. Public: Check gift card balance (for customer checkout)
const checkGiftCardBalance = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Gift card code is required",
      });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "-");
    const giftCard = await GiftCard.findOne({ code: cleanCode });

    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: "Invalid gift card code",
      });
    }

    if (giftCard.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `This gift card is ${giftCard.status}`,
      });
    }

    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      giftCard.status = "expired";
      await giftCard.save();
      return res.status(400).json({
        success: false,
        message: "This gift card has expired",
      });
    }

    if (giftCard.balance <= 0) {
      giftCard.status = "depleted";
      await giftCard.save();
      return res.status(400).json({
        success: false,
        message: "This gift card has no remaining balance",
      });
    }

    res.status(200).json({
      success: true,
      balance: giftCard.balance,
      currency: giftCard.currency,
      maskedCode: giftCard.maskedCode,
      expiresAt: giftCard.expiresAt,
    });
  } catch (error) {
    console.error("Check gift card balance error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to verify gift card balance",
    });
  }
};

// 4. Update gift card status (Admin)
const updateGiftCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'active' or 'disabled'",
      });
    }

    const card = await GiftCard.findById(id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Gift card not found",
      });
    }

    card.status = status;
    await card.save();

    res.status(200).json({
      success: true,
      message: `Gift card ${status === "active" ? "enabled" : "disabled"} successfully`,
      giftCard: card,
    });
  } catch (error) {
    console.error("Update gift card status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update gift card status",
    });
  }
};

module.exports = {
  getGiftCards,
  createGiftCard,
  checkGiftCardBalance,
  updateGiftCardStatus,
};
