
const Product = require("../models/Product");

// Create product
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            discountPrice,
            category,
            images,
            stock,
            brand,
            sku,
            isActive,
        } = req.body;

        if (!name || !description || price === undefined || !category) {
            return res.status(400).json({
                success: false,
                message: "Name, description, price and category are required",
            });
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid non-negative number",
            });
        }

        if (
            discountPrice !== undefined &&
            discountPrice !== null &&
            discountPrice !== "" &&
            (
                !Number.isFinite(Number(discountPrice)) ||
                Number(discountPrice) < 0 ||
                Number(discountPrice) >= Number(price)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Discount price must be lower than the original price",
            });
        }

        const product = await Product.create({
            name,
            description,
            price: Number(price),
            discountPrice:
                discountPrice === undefined ||
                    discountPrice === null ||
                    discountPrice === ""
                    ? null
                    : Number(discountPrice),
            category,
            images,
            stock,
            brand,
            sku,
            isActive,
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "SKU already exists",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create product",
        });
    }
};

// Get all products with search, filter, and pagination
exports.getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            isActive,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
            ];
        }

        if (category) {
            filter.category = {
                $regex: `^${category}$`,
                $options: "i",
            };
        }

        if (minPrice !== undefined) {
            const price = Number(minPrice);

            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({
                    success: false,
                    message: "minPrice must be a valid non-negative number",
                });
            }

            filter.price = { ...filter.price, $gte: price };
        }

        if (maxPrice !== undefined) {
            const price = Number(maxPrice);

            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({
                    success: false,
                    message: "maxPrice must be a valid non-negative number",
                });
            }

            filter.price = { ...filter.price, $lte: price };
        }

        if (
            minPrice !== undefined &&
            maxPrice !== undefined &&
            Number(minPrice) > Number(maxPrice)
        ) {
            return res.status(400).json({
                success: false,
                message: "minPrice cannot be greater than maxPrice",
            });
        }

        if (isActive !== undefined) {
            if (!["true", "false"].includes(isActive)) {
                return res.status(400).json({
                    success: false,
                    message: "isActive must be true or false",
                });
            }

            filter.isActive = isActive === "true";
        }

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            !Number.isInteger(pageSize) ||
            pageNumber < 1 ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "page must be >= 1 and limit must be between 1 and 100",
            });
        }

        const skip = (pageNumber - 1) * pageSize;

        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),
            Product.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: products.length,
            totalProducts,
            totalPages: Math.ceil(totalProducts / pageSize),
            currentPage: pageNumber,
            products,
        });
    } catch (error) {
        console.error("Get products error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
};

// Get single product
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "description",
            "price",
            "discountPrice",
            "category",
            "images",
            "stock",
            "brand",
            "sku",
            "isActive",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        const currentProduct = await Product.findById(req.params.id);

        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const finalPrice = updates.price ?? currentProduct.price;
        const finalDiscountPrice =
            updates.discountPrice === undefined
                ? currentProduct.discountPrice
                : updates.discountPrice;

        if (
            !Number.isFinite(Number(finalPrice)) ||
            Number(finalPrice) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid non-negative number",
            });
        }

        if (updates.price !== undefined) {
            updates.price = Number(updates.price);
        }

        if (
            finalDiscountPrice !== null &&
            finalDiscountPrice !== undefined &&
            finalDiscountPrice !== ""
        ) {
            if (
                !Number.isFinite(Number(finalDiscountPrice)) ||
                Number(finalDiscountPrice) < 0 ||
                Number(finalDiscountPrice) >= Number(finalPrice)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Discount price must be lower than the original price",
                });
            }

            updates.discountPrice = Number(finalDiscountPrice);
        } else if (updates.discountPrice !== undefined) {
            updates.discountPrice = null;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID or field value",
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "SKU already exists",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update product",
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
        });
    }
};
