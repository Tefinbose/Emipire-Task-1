const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        discountPrice: {
            type: Number,
            default: null,
            min: 0,
        },

        category: {
            type: String,
            required: true,
            trim: true,
        },

        images: {
            type: [String],
            default: [],
        },

        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "Stock must be an integer",
            },
        },

        brand: {
            type: String,
            trim: true,
            default: "",
        },

        sku: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);
