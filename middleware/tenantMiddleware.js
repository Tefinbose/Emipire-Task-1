const mongoose = require("mongoose");
const Store = require("../models/Store");
const Admin = require("../models/Admin");

/**
 * Tenant resolution middleware.
 * Ensures every authenticated request is bound to an active Store context.
 */
const resolveStore = async (req, res, next) => {
  try {
    const adminUser = req.admin || (req.user && req.user.role === "admin" ? req.user : null);
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before resolving store context",
      });
    }

    const adminId = adminUser._id || adminUser.id;
    const headerStoreId = req.headers["x-store-id"];
    let store = null;

    // Fetch full admin doc to get stores and currentStore
    const adminDoc = await Admin.findById(adminId);
    if (!adminDoc) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found",
      });
    }

    // 1. Check if a valid storeId is passed in headers and admin has access
    if (headerStoreId && mongoose.Types.ObjectId.isValid(headerStoreId)) {
      const candidateStore = await Store.findById(headerStoreId);
      if (candidateStore) {
        const hasAccess =
          candidateStore.owner.toString() === adminId.toString() ||
          (adminDoc.stores || []).some((sId) => sId.toString() === candidateStore._id.toString());
        if (hasAccess) {
          store = candidateStore;
        }
      }
    }

    // 2. Fall back to admin's currentStore
    if (!store && adminDoc.currentStore) {
      store = await Store.findById(adminDoc.currentStore);
    }

    // 3. Fall back to any store owned by or linked to the admin
    if (!store) {
      store = await Store.findOne({
        $or: [
          { owner: adminId },
          { _id: { $in: adminDoc.stores || [] } },
        ],
      });
    }

    // 4. If absolutely no store exists, bootstrap default store
    if (!store) {
      const slugSuffix = adminId.toString().slice(-4);
      store = await Store.create({
        name: "Empire Main Store",
        slug: `empire-main-${slugSuffix}`,
        owner: adminId,
        contactEmail: adminDoc.email || "support@empire.com",
        supportPhone: "+91 98765 43210",
        currency: "INR",
        currencySymbol: "₹",
        timezone: "Asia/Kolkata (IST)",
        plan: "growth",
        status: "active",
      });

      await Admin.findByIdAndUpdate(adminId, {
        $addToSet: { stores: store._id },
        $set: { currentStore: store._id },
      });
      adminDoc.currentStore = store._id;
      adminDoc.stores = [store._id];
    }

    // Attach to request
    req.admin = adminDoc;
    req.store = store;
    req.storeId = store._id;
    next();
  } catch (error) {
    console.error("Store tenant resolution error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error resolving tenant store",
    });
  }
};

module.exports = { resolveStore };
