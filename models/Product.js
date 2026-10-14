const mongoose = require("mongoose");
require("./Collection");

const variantOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: Number,
      default: 1,
    },
    values: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const selectedOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    costPerItem: {
      type: Number,
      default: 0,
      min: 0,
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
    inventoryQuantity: {
      type: Number,
      default: 0,
    },
    inventoryTracked: {
      type: Boolean,
      default: true,
    },
    continueSellingOutOfStock: {
      type: Boolean,
      default: false,
    },
    requiresShipping: {
      type: Boolean,
      default: true,
    },
    weight: {
      type: Number,
      default: 0,
      min: 0,
    },
    weightUnit: {
      type: String,
      enum: ["kg", "g", "lb", "oz"],
      default: "kg",
    },
    image: {
      type: String,
      default: "",
    },
    selectedOptions: [selectedOptionSchema],
    position: {
      type: Number,
      default: 1,
    },
  },
  { _id: true, timestamps: true }
);

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    altText: {
      type: String,
      default: "",
      trim: true,
    },
    mediaContentType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "MODEL_3D", "EXTERNAL_VIDEO"],
      default: "IMAGE",
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    position: {
      type: Number,
      default: 1,
    },
  },
  { _id: true }
);

const inventoryLocationSchema = new mongoose.Schema(
  {
    locationName: {
      type: String,
      default: "Shop location",
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
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
  },
  { _id: false }
);

const metafieldSchema = new mongoose.Schema(
  {
    namespace: {
      type: String,
      default: "custom",
      trim: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "single_line_text_field",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      index: true,
    },
    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },

    // Status: active, draft, unlisted (Shopify standard, plus backward-compatibility)
    status: {
      type: String,
      enum: ["active", "draft", "unlisted", "archived", "approved", "pending", "rejected"],
      default: "active",
    },

    // Publishing & Sales Channels
    publishing: {
      allChannels: {
        type: Boolean,
        default: true,
      },
      salesChannels: {
        type: [String],
        default: ["Online Store", "Point of Sale"],
      },
      publishedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // Product Organization
    productType: {
      type: String,
      default: "",
      trim: true,
    },
    vendor: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    collections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    themeTemplate: {
      type: String,
      default: "Default product",
      trim: true,
    },

    // Media
    media: [mediaSchema],
    image: {
      type: String,
      default: "",
    },

    // Pricing
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    unitPrice: {
      amount: {
        type: Number,
        default: null,
      },
      measurementUnit: {
        type: String,
        default: "",
        trim: true,
      },
    },
    chargeTax: {
      type: Boolean,
      default: true,
    },
    costPerItem: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Inventory
    inventoryTracked: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    inventoryLocations: [inventoryLocationSchema],
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    barcode: {
      type: String,
      default: "",
      trim: true,
    },
    continueSellingOutOfStock: {
      type: Boolean,
      default: false,
    },

    // Shipping
    isPhysicalProduct: {
      type: Boolean,
      default: true,
    },
    packageType: {
      type: String,
      default: "Store default",
      trim: true,
    },
    packageDimensions: {
      length: {
        type: Number,
        default: 0,
      },
      width: {
        type: Number,
        default: 0,
      },
      height: {
        type: Number,
        default: 0,
      },
      unit: {
        type: String,
        enum: ["cm", "in"],
        default: "cm",
      },
    },
    weight: {
      type: Number,
      default: 0,
      min: 0,
    },
    weightUnit: {
      type: String,
      enum: ["kg", "g", "lb", "oz"],
      default: "kg",
    },
    countryOfOrigin: {
      type: String,
      default: "",
      trim: true,
    },
    hsCode: {
      type: String,
      default: "",
      trim: true,
    },

    // Variants
    hasVariants: {
      type: Boolean,
      default: false,
    },
    options: [variantOptionSchema],
    variants: [variantSchema],

    // Product Metafields
    metafields: [metafieldSchema],

    // Search Engine Listing (SEO)
    seo: {
      pageTitle: {
        type: String,
        default: "",
        trim: true,
      },
      metaDescription: {
        type: String,
        default: "",
        trim: true,
      },
      urlHandle: {
        type: String,
        default: "",
        trim: true,
      },
    },
    handle: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Ownership / Metadata
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Slugify helper
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

// Pre-validate synchronization hook
productSchema.pre("validate", function () {
  // Sync title and name
  if (this.title && !this.name) {
    this.name = this.title;
  } else if (this.name && !this.title) {
    this.title = this.name;
  }

  // Generate handle if not provided
  if (!this.handle) {
    const raw = this.seo?.urlHandle || this.title || this.name || "product";
    this.handle = slugify(raw);
  }

  // Ensure seo.urlHandle matches handle if empty
  if (this.seo && !this.seo.urlHandle) {
    this.seo.urlHandle = this.handle;
  }

  // Sync media and primary image
  if (Array.isArray(this.media) && this.media.length > 0) {
    if (!this.image) {
      this.image = this.media[0].url;
    }
  } else if (this.image) {
    this.media = [
      {
        url: this.image,
        altText: this.title || "",
        mediaContentType: "IMAGE",
        position: 1,
      },
    ];
  }

  // Calculate stock / quantity when variants exist
  if (this.hasVariants && Array.isArray(this.variants) && this.variants.length > 0) {
    const totalVariantQty = this.variants.reduce(
      (sum, variant) => sum + (Number(variant.inventoryQuantity) || 0),
      0
    );
    this.quantity = totalVariantQty;
    this.stock = totalVariantQty;
  } else {
    // Sync quantity and stock
    if (this.quantity !== undefined && (this.stock === undefined || this.stock === 0)) {
      this.stock = Number(this.quantity) || 0;
    } else if (this.stock !== undefined && (this.quantity === undefined || this.quantity === 0)) {
      this.quantity = Number(this.stock) || 0;
    }
  }

  // Initialize shop location inventory if empty
  if (!this.inventoryLocations || this.inventoryLocations.length === 0) {
    this.inventoryLocations = [
      {
        locationName: "Shop location",
        quantity: this.quantity || 0,
        available: this.quantity || 0,
        onHand: this.quantity || 0,
        committed: 0,
        incoming: 0,
      },
    ];
  }
});

module.exports = mongoose.model("Product", productSchema);