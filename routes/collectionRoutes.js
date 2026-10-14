const express = require("express");
const router = express.Router();

const {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
} = require("../controllers/collectionController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Public routes (storefront browsing)
router.get("/", getCollections);
router.get("/:id", getCollectionById);

// Admin routes
router.post("/", verifyToken, requireAdmin, createCollection);
router.put("/:id", verifyToken, requireAdmin, updateCollection);
router.delete("/:id", verifyToken, requireAdmin, deleteCollection);

module.exports = router;
