const mongoose = require("mongoose");

const collectionRuleSchema = new mongoose.Schema(
  {
    column: {
      type: String,
      enum: [
        "title",
        "type",
        "vendor",
        "tag",
        "price",
        "compare_at_price",
        "weight",
        "inventory_stock",
        "variant_title",
      ],
      required: true,
    },
    relation: {
      type: String,
      enum: [
        "equals",
        "not_equals",
        "greater_than",
        "less_than",
        "starts_with",
        "ends_with",
        "contains",
        "not_contains",
      ],
      required: true,
    },
    condition: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const collectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    handle: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["manual", "automated"],
      default: "manual",
    },
    rules: [collectionRuleSchema],
    disjunctive: {
      type: Boolean,
      default: false, // false = match all conditions (AND); true = match any condition (OR)
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    image: {
      url: {
        type: String,
        default: "",
      },
      altText: {
        type: String,
        default: "",
      },
      width: Number,
      height: Number,
    },
    sortOrder: {
      type: String,
      enum: [
        "manual",
        "best-selling",
        "title-ascending",
        "title-descending",
        "price-ascending",
        "price-descending",
        "created-descending",
        "created-ascending",
      ],
      default: "best-selling",
    },
    published: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    salesChannels: {
      type: [String],
      default: ["Online Store"],
    },
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
  },
  { timestamps: true }
);

// Slugify helper
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

collectionSchema.pre("validate", function () {
  if (!this.handle) {
    this.handle = slugify(this.title || "collection");
  }
  if (this.seo && !this.seo.urlHandle) {
    this.seo.urlHandle = this.handle;
  }
});

module.exports = mongoose.model("Collection", collectionSchema);
