const express = require("express");

const { protectAdmin } = require("../middleware/adminMiddleware");
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require("../controllers/productController");

const productRoutes = express.Router();

productRoutes.post("/", protectAdmin, createProduct);

productRoutes.get("/", protectAdmin, getProducts);

productRoutes.get("/:id", protectAdmin, getProductById);

productRoutes.put("/:id", protectAdmin, updateProduct);

productRoutes.delete("/:id", protectAdmin, deleteProduct);

module.exports = productRoutes;
