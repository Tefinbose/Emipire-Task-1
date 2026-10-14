const mongoose = require("mongoose");
const Store = require("../models/Store");
const Admin = require("../models/Admin");

// Helper to slugify store name
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// 1. Get all stores accessible to admin
exports.getStores = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    const storeIds = admin?.stores || [];

    const stores = await Store.find({
      $or: [{ owner: req.admin._id }, { _id: { $in: storeIds } }],
    }).sort({ createdAt: -1 });

    const formatted = stores.map((s) => ({
      ...s.toObject(),
      isCurrent: req.storeId && s._id.toString() === req.storeId.toString(),
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      currentStoreId: req.storeId,
    });
  } catch (error) {
    console.error("Get stores error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch merchant stores",
    });
  }
};

// 2. Get current active store
exports.getCurrentStore = async (req, res) => {
  try {
    const store = await Store.findById(req.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Active store not found",
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error("Get current store error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch store details",
    });
  }
};

// 3. Create a new store
exports.createStore = async (req, res) => {
  try {
    const {
      name,
      slug,
      domain,
      contactEmail,
      supportPhone,
      currency,
      currencySymbol,
      timezone,
      plan,
      address,
      makeActive = true,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Store name is required",
      });
    }

    const cleanSlug = slugify(slug || name);
    if (!cleanSlug) {
      return res.status(400).json({
        success: false,
        message: "Invalid store identifier/slug",
      });
    }

    // Check slug uniqueness
    const existing = await Store.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Store slug "${cleanSlug}" is already in use. Please choose another name or slug.`,
      });
    }

    const newStore = await Store.create({
      name: name.trim(),
      slug: cleanSlug,
      owner: req.admin._id,
      domain: domain?.trim() || "",
      contactEmail: contactEmail?.trim() || req.admin.email,
      supportPhone: supportPhone?.trim() || "",
      currency: currency?.toUpperCase() || "INR",
      currencySymbol: currencySymbol || "₹",
      timezone: timezone || "Asia/Kolkata (IST)",
      plan: plan || "growth",
      address: address || {},
      status: "active",
    });

    // Link new store to Admin
    const updateOps = { $addToSet: { stores: newStore._id } };
    if (makeActive) {
      updateOps.$set = { currentStore: newStore._id };
    }
    await Admin.findByIdAndUpdate(req.admin._id, updateOps);

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: newStore,
    });
  } catch (error) {
    console.error("Create store error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create store",
    });
  }
};

// 4. Update current active store configuration & settings
exports.updateCurrentStore = async (req, res) => {
  try {
    const {
      name,
      domain,
      contactEmail,
      supportPhone,
      currency,
      currencySymbol,
      timezone,
      shippingFee,
      freeShippingThreshold,
      taxRate,
      emailNotifications,
      stockAlerts,
      address,
      status,
    } = req.body;

    const store = await Store.findById(req.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    if (name) store.name = name.trim();
    if (domain !== undefined) store.domain = domain.trim();
    if (contactEmail !== undefined) store.contactEmail = contactEmail.trim();
    if (supportPhone !== undefined) store.supportPhone = supportPhone.trim();
    if (currency) store.currency = currency.toUpperCase();
    if (currencySymbol) store.currencySymbol = currencySymbol;
    if (timezone) store.timezone = timezone;
    if (shippingFee !== undefined) store.shippingFee = Math.max(0, Number(shippingFee) || 0);
    if (freeShippingThreshold !== undefined)
      store.freeShippingThreshold = Math.max(0, Number(freeShippingThreshold) || 0);
    if (taxRate !== undefined) store.taxRate = Math.max(0, Number(taxRate) || 0);
    if (emailNotifications !== undefined) store.emailNotifications = Boolean(emailNotifications);
    if (stockAlerts !== undefined) store.stockAlerts = Boolean(stockAlerts);
    if (address) store.address = { ...store.address, ...address };
    if (status) store.status = status;

    await store.save();

    res.status(200).json({
      success: true,
      message: "Store settings saved successfully",
      data: store,
    });
  } catch (error) {
    console.error("Update store settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update store settings",
    });
  }
};

// 5. Switch active store context
exports.switchStore = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID format",
      });
    }

    const targetStore = await Store.findById(id);
    if (!targetStore) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Verify ownership or access
    const admin = await Admin.findById(req.admin._id);
    const hasAccess =
      targetStore.owner.toString() === admin._id.toString() ||
      (admin.stores || []).some((sId) => sId.toString() === id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to switch to this store",
      });
    }

    // Update current store on admin document
    admin.currentStore = targetStore._id;
    if (!admin.stores.includes(targetStore._id)) {
      admin.stores.push(targetStore._id);
    }
    await admin.save();

    res.status(200).json({
      success: true,
      message: `Active store switched to "${targetStore.name}"`,
      data: targetStore,
    });
  } catch (error) {
    console.error("Switch store error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to switch active store",
    });
  }
};

// 6. Delete or archive store
exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    if (store.owner.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the store owner can delete this store",
      });
    }

    const admin = await Admin.findById(req.admin._id);
    const totalStores = await Store.countDocuments({
      $or: [{ owner: req.admin._id }, { _id: { $in: admin.stores } }],
    });

    if (totalStores <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your only store. At least one active store is required.",
      });
    }

    await Store.findByIdAndDelete(id);

    // Remove from admin stores
    admin.stores = admin.stores.filter((sId) => sId.toString() !== id);
    if (admin.currentStore && admin.currentStore.toString() === id) {
      admin.currentStore = admin.stores[0];
    }
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Store deleted successfully",
      newCurrentStoreId: admin.currentStore,
    });
  } catch (error) {
    console.error("Delete store error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete store",
    });
  }
};

// 7. Get public store configuration (for customer storefronts)
exports.getPublicStore = async (req, res) => {
  try {
    const { slug } = req.params;
    let store = null;

    if (slug) {
      store = await Store.findOne({ slug: slug.toLowerCase(), status: "active" });
    } else {
      store = await Store.findOne({ status: "active" }).sort({ createdAt: 1 });
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found or currently inactive",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        domain: store.domain,
        contactEmail: store.contactEmail,
        supportPhone: store.supportPhone,
        currency: store.currency,
        currencySymbol: store.currencySymbol,
        timezone: store.timezone,
        shippingFee: store.shippingFee,
        freeShippingThreshold: store.freeShippingThreshold,
        taxRate: store.taxRate,
        address: store.address,
        status: store.status,
      },
    });
  } catch (error) {
    console.error("Get public store error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch public store details",
    });
  }
};
