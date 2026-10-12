
const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  addProductByUser,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require("../controllers/productController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Public: approved products only
router.get("/", getProducts);

// User: submit product and view own submissions
router.post("/user", verifyToken, addProductByUser);
router.get("/my-products", verifyToken, (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "A normal user account is required",
    });
  }

  next();
}, getMyProducts);

// Public: one approved product
router.get("/:id", getProductById);

// Admin-only product management
router.post("/", verifyToken, requireAdmin, createProduct);
router.put("/:id", verifyToken, requireAdmin, updateProduct);
router.delete("/:id", verifyToken, requireAdmin, deleteProduct);

module.exports = router;
