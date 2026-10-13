const mongoose = require("mongoose");

const marketingAutomationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    channel: {
      type: String,
      default: "email",
    },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
    trigger: {
      type: String,
      default: "",
    },
    delay: {
      type: String,
      default: "Immediate",
    },
    discountCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    runsTriggered: {
      type: Number,
      default: 0,
      min: 0,
    },
    openRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    clickRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenueRecovered: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketingAutomation", marketingAutomationSchema);
