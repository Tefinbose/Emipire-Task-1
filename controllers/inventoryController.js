const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Transfer = require("../models/Transfer");
const PurchaseOrder = require("../models/PurchaseOrder");

// ──────────────────────────────────────────
// GET /api/inventory  — list all inventory items
// ──────────────────────────────────────────
const getInventory = async (req, res) => {
  try {
    const {
      search = "",
      tracked,
      lowStock,
      outOfStock,
      location,
      page = 1,
      limit = 50,
      sort = "-updatedAt",
    } = req.query;

    const andConditions = [];

    const storeId = req.headers["x-store-id"] || req.query.storeId || req.storeId;
    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
      andConditions.push({
        $or: [
          { store: new mongoose.Types.ObjectId(storeId) },
          { store: storeId },
          { store: null },
          { store: { $exists: false } },
        ],
      });
    }

    if (search) {
      const regex = new RegExp(search, "i");
      andConditions.push({
        $or: [
          { productTitle: regex },
          { variantTitle: regex },
          { sku: regex },
          { barcode: regex },
        ],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    if (tracked !== undefined) {
      filter.tracked = tracked === "true";
    }

    if (location) {
      filter.locationName = new RegExp(location, "i");
    }

    if (lowStock === "true") {
      filter.available = { $gt: 0, $lte: 10 };
    }

    if (outOfStock === "true") {
      filter.available = { $lte: 0 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate("product", "title image status price hasVariants"),
      Inventory.countDocuments(filter),
    ]);

    // Compute summary stats
    const allItems = await Inventory.find({});
    const totalAvailable = allItems.reduce((s, i) => s + (i.available || 0), 0);
    const totalCommitted = allItems.reduce((s, i) => s + (i.committed || 0), 0);
    const totalIncoming = allItems.reduce((s, i) => s + (i.incoming || 0), 0);
    const lowStockCount = allItems.filter(
      (i) => i.tracked && i.available > 0 && i.available <= 10
    ).length;
    const outOfStockCount = allItems.filter(
      (i) => i.tracked && i.available <= 0
    ).length;
    const totalValue = allItems.reduce(
      (s, i) => s + (i.unitCost || 0) * (i.onHand || 0),
      0
    );

    res.json({
      success: true,
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      summary: {
        totalItems: allItems.length,
        totalAvailable,
        totalCommitted,
        totalIncoming,
        lowStockCount,
        outOfStockCount,
        totalValue: Math.round(totalValue * 100) / 100,
      },
    });
  } catch (error) {
    console.error("getInventory error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────
// GET /api/inventory/:id  — single item
// ──────────────────────────────────────────
const getInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).populate(
      "product",
      "title image status price hasVariants variants"
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found" });
    }

    res.json({ success: true, item });
  } catch (error) {
    console.error("getInventoryItem error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────
// POST /api/inventory/adjust  — adjust stock
// Body: { inventoryId, quantity, activity, reference, staffMember }
// ──────────────────────────────────────────
const adjustInventory = async (req, res) => {
  try {
    const {
      inventoryId,
      quantity,
      activity = "correction",
      reference = "",
      staffMember = "Admin",
    } = req.body;

    if (!inventoryId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "inventoryId and quantity are required",
      });
    }

    const item = await Inventory.findById(inventoryId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found" });
    }

    const qtyChange = Number(quantity);
    item.available = Math.max(0, item.available + qtyChange);
    item.onHand = Math.max(0, item.onHand + qtyChange);

    item.history.push({
      date: new Date(),
      activity,
      quantityChanged: qtyChange,
      newAvailable: item.available,
      reference,
      staffMember,
    });

    await item.save();

    // Sync back to product
    await syncProductStock(item.product, item.variantId);

    res.json({ success: true, item });
  } catch (error) {
    console.error("adjustInventory error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────
// POST /api/inventory/bulk-adjust  — bulk adjust multiple items
// Body: { adjustments: [{ inventoryId, quantity, activity, reference }] }
// ──────────────────────────────────────────
const bulkAdjustInventory = async (req, res) => {
  try {
    const { adjustments = [] } = req.body;

    if (!adjustments.length) {
      return res.status(400).json({
        success: false,
        message: "No adjustments provided",
      });
    }

    const results = [];

    for (const adj of adjustments) {
      const item = await Inventory.findById(adj.inventoryId);
      if (!item) continue;

      const qtyChange = Number(adj.quantity);
      item.available = Math.max(0, item.available + qtyChange);
      item.onHand = Math.max(0, item.onHand + qtyChange);

      item.history.push({
        date: new Date(),
        activity: adj.activity || "correction",
        quantityChanged: qtyChange,
        newAvailable: item.available,
        reference: adj.reference || "",
        staffMember: adj.staffMember || "Admin",
      });

      await item.save();
      await syncProductStock(item.product, item.variantId);
      results.push(item);
    }

    res.json({ success: true, adjusted: results.length, items: results });
  } catch (error) {
    console.error("bulkAdjustInventory error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────
// PUT /api/inventory/:id  — update inventory item fields
// ──────────────────────────────────────────
const updateInventoryItem = async (req, res) => {
  try {
    const updates = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found" });
    }

    const allowedFields = [
      "tracked",
      "locationName",
      "unitCost",
      "continueSellingOutOfStock",
      "barcode",
      "sku",
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        item[field] = updates[field];
      }
    }

    await item.save();
    res.json({ success: true, item });
  } catch (error) {
    console.error("updateInventoryItem error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────
// GET /api/inventory/transfers — list all transfers
// ──────────────────────────────────────────
const getTransfers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { transferNumber: regex },
        { "origin.name": regex },
        { "destination.name": regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transfers, total] = await Promise.all([
      Transfer.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit))
        .populate("lineItems.product", "title image"),
      Transfer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      transfers,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("getTransfers error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────
// GET /api/inventory/purchase-orders — list all purchase orders
// ──────────────────────────────────────────
const getPurchaseOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { poNumber: regex },
        { "supplier.name": regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit))
        .populate("lineItems.product", "title image"),
      PurchaseOrder.countDocuments(filter),
    ]);

    res.json({
      success: true,
      purchaseOrders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("getPurchaseOrders error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────
// POST /api/inventory/sync  — re-sync inventory from products
// ──────────────────────────────────────────
const syncAllInventory = async (req, res) => {
  try {
    const storeId = req.headers["x-store-id"] || req.storeId;
    const prodFilter = {};
    if (storeId) {
      prodFilter.$or = [
        { store: storeId },
        { store: null },
        { store: { $exists: false } },
      ];
    }
    const products = await Product.find(prodFilter);
    let created = 0;
    let updated = 0;

    for (const product of products) {
      const itemStore = product.store || storeId || null;
      if (product.hasVariants && product.variants?.length > 0) {
        for (const variant of product.variants) {
          const existing = await Inventory.findOne({
            product: product._id,
            variantId: variant._id.toString(),
          });

          if (existing) {
            existing.productTitle = product.title;
            existing.variantTitle = variant.title;
            existing.sku = variant.sku || "";
            existing.barcode = variant.barcode || "";
            if (!existing.store && itemStore) existing.store = itemStore;
            await existing.save();
            updated++;
          } else {
            await Inventory.create({
              store: itemStore,
              product: product._id,
              variantId: variant._id.toString(),
              productTitle: product.title,
              variantTitle: variant.title,
              sku: variant.sku || "",
              barcode: variant.barcode || "",
              tracked: variant.inventoryTracked !== false,
              available: variant.inventoryQuantity || 0,
              onHand: variant.inventoryQuantity || 0,
              committed: 0,
              incoming: 0,
              unitCost: variant.costPerItem || 0,
              continueSellingOutOfStock:
                variant.continueSellingOutOfStock || false,
            });
            created++;
          }
        }
      } else {
        const existing = await Inventory.findOne({
          product: product._id,
          variantId: null,
        });

        if (existing) {
          existing.productTitle = product.title;
          existing.sku = product.sku || "";
          existing.barcode = product.barcode || "";
          if (!existing.store && itemStore) existing.store = itemStore;
          await existing.save();
          updated++;
        } else {
          await Inventory.create({
            store: itemStore,
            product: product._id,
            variantId: null,
            productTitle: product.title,
            variantTitle: "",
            sku: product.sku || "",
            barcode: product.barcode || "",
            tracked: product.inventoryTracked !== false,
            available: product.quantity || product.stock || 0,
            onHand: product.quantity || product.stock || 0,
            committed: 0,
            incoming: 0,
            unitCost: product.costPerItem || 0,
            continueSellingOutOfStock:
              product.continueSellingOutOfStock || false,
          });
          created++;
        }
      }
    }

    res.json({
      success: true,
      message: `Inventory sync complete: ${created} created, ${updated} updated`,
      created,
      updated,
    });
  } catch (error) {
    console.error("syncAllInventory error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────
// Helper: sync product stock back from inventory
// ──────────────────────────────────────────
async function syncProductStock(productId, variantId) {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    if (variantId && product.hasVariants) {
      const variant = product.variants.id(variantId);
      if (variant) {
        const inv = await Inventory.findOne({
          product: productId,
          variantId: variantId,
        });
        if (inv) {
          variant.inventoryQuantity = inv.available;
        }
      }
      const totalQty = product.variants.reduce(
        (sum, v) => sum + (v.inventoryQuantity || 0),
        0
      );
      product.quantity = totalQty;
      product.stock = totalQty;
    } else {
      const inv = await Inventory.findOne({
        product: productId,
        variantId: null,
      });
      if (inv) {
        product.quantity = inv.available;
        product.stock = inv.available;
      }
    }

    await product.save();
  } catch (err) {
    console.error("syncProductStock error:", err.message);
  }
}

module.exports = {
  getInventory,
  getInventoryItem,
  adjustInventory,
  bulkAdjustInventory,
  updateInventoryItem,
  getTransfers,
  getPurchaseOrders,
  syncAllInventory,
};
