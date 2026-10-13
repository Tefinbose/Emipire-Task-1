const mongoose = require("mongoose");

const purchaseOrderLineItemSchema = new mongoose.Schema(
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
    supplierSku: {
      type: String,
      trim: true,
      default: "",
    },
    quantityOrdered: {
      type: Number,
      required: true,
      min: 1,
    },
    quantityReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    supplier: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
      address: {
        address1: { type: String, default: "" },
        city: { type: String, default: "" },
        province: { type: String, default: "" },
        country: { type: String, default: "" },
        zip: { type: String, default: "" },
      },
      paymentTerms: {
        type: String,
        default: "Net 30",
        trim: true,
      },
      currency: {
        type: String,
        default: "INR",
        trim: true,
      },
    },
    destinationLocation: {
      type: String,
      default: "Shop location",
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "ordered", "partial", "received", "cancelled"],
      default: "draft",
    },
    lineItems: [purchaseOrderLineItemSchema],
    totalQuantity: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    expectedArrivalDate: {
      type: Date,
      default: null,
    },
    orderedAt: {
      type: Date,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    trackingNumber: {
      type: String,
      default: "",
      trim: true,
    },
    shippingCarrier: {
      type: String,
      default: "",
      trim: true,
    },
    referenceNumber: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
    linkedTransfer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transfer",
      default: null,
    },
  },
  { timestamps: true }
);

purchaseOrderSchema.pre("validate", function () {
  if (Array.isArray(this.lineItems)) {
    this.totalQuantity = this.lineItems.reduce(
      (sum, item) => sum + (Number(item.quantityOrdered) || 0),
      0
    );
    this.subtotal = this.lineItems.reduce(
      (sum, item) => sum + (Number(item.totalCost) || 0),
      0
    );
    this.totalAmount = (this.subtotal || 0) + (this.taxAmount || 0) + (this.shippingCost || 0);
  }
});

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
