const mongoose = require("mongoose");

const transferLineItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    quantityShipped: {
      type: Number,
      required: true,
      min: 1,
    },
    quantityReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityRejected: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const transferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    origin: {
      type: {
        type: String,
        enum: ["supplier", "location"],
        default: "supplier",
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        default: "",
      },
    },
    destination: {
      name: {
        type: String,
        default: "Shop location",
        trim: true,
      },
      address: {
        type: String,
        default: "",
      },
    },
    status: {
      type: String,
      enum: ["draft", "ready_to_ship", "in_transit", "partial", "completed", "cancelled"],
      default: "draft",
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      default: null,
    },
    expectedArrivalDate: {
      type: Date,
      default: null,
    },
    shippingCarrier: {
      type: String,
      default: "",
      trim: true,
    },
    trackingNumber: {
      type: String,
      default: "",
      trim: true,
    },
    trackingUrl: {
      type: String,
      default: "",
      trim: true,
    },
    lineItems: [transferLineItemSchema],
    notes: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transfer", transferSchema);
