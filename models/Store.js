const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    domain: {
      type: String,
      trim: true,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      default: "",
    },
    supportPhone: {
      type: String,
      trim: true,
      default: "",
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    currencySymbol: {
      type: String,
      default: "₹",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata (IST)",
    },
    shippingFee: {
      type: Number,
      default: 50,
      min: 0,
    },
    freeShippingThreshold: {
      type: Number,
      default: 500,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 18,
      min: 0,
    },
    plan: {
      type: String,
      enum: ["starter", "growth", "enterprise"],
      default: "growth",
    },
    status: {
      type: String,
      enum: ["active", "paused", "setup"],
      default: "active",
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    stockAlerts: {
      type: Boolean,
      default: true,
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
