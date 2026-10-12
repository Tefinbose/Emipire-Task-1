
const Product = require("../models/Product");

// Get approved products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "approved" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get one approved product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      status: "approved",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }
};

// Admin creates an approved product
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, image } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      image,
      addedBy: null,
      status: "approved",
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// User submits a product for approval
const addProductByUser = async (req, res) => {
  try {
    const { name, description, price, category, stock, image } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    if (
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      (stock !== undefined &&
        (!Number.isFinite(Number(stock)) || Number(stock) < 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Price and stock must be valid non-negative numbers",
      });
    }

    // This endpoint requires a normal User account.
    if (!req.user || !req.user._id || req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "A normal user account is required to submit products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      stock: stock === undefined ? 0 : Number(stock),
      image,
      addedBy: req.user._id,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Product submitted for admin approval",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin updates a product
const updateProduct = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "stock",
      "image",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin deletes a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }
};

// User views their own submitted products
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      addedBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  addProductByUser,
  updateProduct,
  deleteProduct,
  getMyProducts,
};
