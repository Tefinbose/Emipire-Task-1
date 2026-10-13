const mongoose = require("mongoose");

const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    maskedCode: {
      type: String,
      required: true,
      trim: true,
    },
    initialValue: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "disabled", "expired", "depleted"],
      default: "active",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recipientEmail: {
      type: String,
      trim: true,
      default: "",
    },
    recipientName: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      default: null, // null means no expiration
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GiftCard", giftCardSchema);
