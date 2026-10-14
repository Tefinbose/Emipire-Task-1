const mongoose = require("mongoose");

const inventoryAdjustmentHistorySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    activity: {
      type: String,
      enum: [
        "correction",
        "count",
        "received",
        "transfer",
        "purchase_order",
        "order_fulfillment",
        "order_cancellation",
        "return",
        "damaged",
      ],
      default: "correction",
    },
    quantityChanged: {
      type: Number,
      required: true,
    },
    newAvailable: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      default: "",
    },
    staffMember: {
      type: String,
      default: "Admin",
    },
  },
  { _id: false }
);

const inventorySchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: String,
      default: null,
    },
    productTitle: {
      type: String,
      default: "",
    },
    variantTitle: {
      type: String,
      default: "",
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    barcode: {
      type: String,
      trim: true,
      default: "",
    },
    locationName: {
      type: String,
      default: "Shop location",
      trim: true,
    },
    tracked: {
      type: Boolean,
      default: true,
    },
    available: {
      type: Number,
      default: 0,
    },
    onHand: {
      type: Number,
      default: 0,
    },
    committed: {
      type: Number,
      default: 0,
    },
    incoming: {
      type: Number,
      default: 0,
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    continueSellingOutOfStock: {
      type: Boolean,
      default: false,
    },
    history: [inventoryAdjustmentHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
