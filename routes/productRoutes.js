const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  bulkUpdateStatus,
  bulkDeleteProducts,
  addProductByUser,
  getMyProducts,
} = require("../controllers/productController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Public / storefront routes
router.get("/", getProducts);
router.get("/handle/:handle", getProductById);

// User-submitted product routes (backward compatibility)
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

// Admin bulk operations
router.patch("/bulk-status", verifyToken, requireAdmin, bulkUpdateStatus);
router.delete("/bulk", verifyToken, requireAdmin, bulkDeleteProducts);

// Single product operations
router.get("/:id", getProductById);
router.post("/", verifyToken, requireAdmin, createProduct);
router.put("/:id", verifyToken, requireAdmin, updateProduct);
router.delete("/:id", verifyToken, requireAdmin, deleteProduct);
router.post("/:id/duplicate", verifyToken, requireAdmin, duplicateProduct);

module.exports = router;
