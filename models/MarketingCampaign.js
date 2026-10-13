const mongoose = require("mongoose");

const marketingCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ["email", "social", "search", "sms", "influencer"],
      default: "email",
    },
    status: {
      type: String,
      enum: ["active", "scheduled", "paused", "completed", "draft"],
      default: "active",
    },
    targetAudience: {
      type: String,
      enum: ["all", "vip", "new_customers", "abandoned_checkout", "repeat_buyers"],
      default: "all",
    },
    discountCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    spend: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    ordersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    ctaText: {
      type: String,
      default: "Shop Now",
      trim: true,
    },
    ctaUrl: {
      type: String,
      default: "/collections/all",
      trim: true,
    },
    utmSource: {
      type: String,
      default: "",
      trim: true,
    },
    utmMedium: {
      type: String,
      default: "",
      trim: true,
    },
    utmCampaign: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    lastDispatchedAt: {
      type: Date,
      default: null,
    },
    recipientsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketingCampaign", marketingCampaignSchema);
