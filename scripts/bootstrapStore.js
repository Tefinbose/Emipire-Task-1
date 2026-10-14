require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");

const bootstrapStore = async () => {
  try {
    await connectDB();

    const admin = await Admin.findOne();
    if (!admin) {
      console.log("No admin found. Please run createAdmin.js first.");
      return;
    }

    let defaultStore = await Store.findOne({ owner: admin._id });

    if (!defaultStore) {
      defaultStore = await Store.create({
        name: "Empire Main Store",
        slug: "empire-main",
        owner: admin._id,
        domain: "empire-store.myshopify.com",
        contactEmail: admin.email || "support@empire.com",
        supportPhone: "+91 98765 43210",
        currency: "INR",
        currencySymbol: "₹",
        timezone: "Asia/Kolkata (IST)",
        shippingFee: 50,
        freeShippingThreshold: 500,
        taxRate: 18,
        plan: "growth",
        status: "active",
        emailNotifications: true,
        stockAlerts: true,
        address: {
          street: "100 Commercial Boulevard",
          city: "Bengaluru",
          state: "Karnataka",
          zipCode: "560001",
          country: "India",
        },
      });
      console.log("Created default store:", defaultStore.name, defaultStore._id);
    } else {
      console.log("Default store already exists:", defaultStore.name, defaultStore._id);
    }

    // Ensure Admin has stores and currentStore set
    let adminUpdated = false;
    if (!admin.stores || admin.stores.length === 0) {
      admin.stores = [defaultStore._id];
      adminUpdated = true;
    } else if (!admin.stores.includes(defaultStore._id)) {
      admin.stores.push(defaultStore._id);
      adminUpdated = true;
    }

    if (!admin.currentStore) {
      admin.currentStore = defaultStore._id;
      adminUpdated = true;
    }

    if (adminUpdated) {
      await admin.save();
      console.log("Admin store references updated.");
    }

    // Link existing products without store
    const productUpdate = await Product.updateMany(
      { $or: [{ store: { $exists: false } }, { store: null }] },
      { $set: { store: defaultStore._id } }
    );
    console.log(`Updated ${productUpdate.modifiedCount} products with store context.`);

    // Link existing orders without store
    const orderUpdate = await Order.updateMany(
      { $or: [{ store: { $exists: false } }, { store: null }] },
      { $set: { store: defaultStore._id } }
    );
    console.log(`Updated ${orderUpdate.modifiedCount} orders with store context.`);

    // Link existing inventory without store
    const inventoryUpdate = await Inventory.updateMany(
      { $or: [{ store: { $exists: false } }, { store: null }] },
      { $set: { store: defaultStore._id } }
    );
    console.log(`Updated ${inventoryUpdate.modifiedCount} inventory records with store context.`);

    console.log("Multi-store bootstrapping completed successfully!");
  } catch (error) {
    console.error("Store bootstrap error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

bootstrapStore();
