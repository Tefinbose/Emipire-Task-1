const express = require("express");
const router = express.Router();

const {
  getInventory,
  getInventoryItem,
  adjustInventory,
  bulkAdjustInventory,
  updateInventoryItem,
  getTransfers,
  getPurchaseOrders,
  syncAllInventory,
} = require("../controllers/inventoryController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// All inventory routes require admin auth
router.use(verifyToken, requireAdmin);

// Inventory items
router.get("/", getInventory);
router.post("/sync", syncAllInventory);
router.post("/adjust", adjustInventory);
router.post("/bulk-adjust", bulkAdjustInventory);

// Transfers & Purchase Orders
router.get("/transfers", getTransfers);
router.get("/purchase-orders", getPurchaseOrders);

// Single inventory item
router.get("/:id", getInventoryItem);
router.put("/:id", updateInventoryItem);

module.exports = router;
