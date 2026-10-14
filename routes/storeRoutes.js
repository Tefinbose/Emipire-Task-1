const express = require("express");
const router = express.Router();

const {
  getStores,
  getCurrentStore,
  createStore,
  updateCurrentStore,
  switchStore,
  deleteStore,
  getPublicStore,
} = require("../controllers/storeController");
const { protectAdmin } = require("../middleware/adminMiddleware");
const { resolveStore } = require("../middleware/tenantMiddleware");

// Public endpoints for customers / storefronts
router.get("/public/active", getPublicStore);
router.get("/public/:slug", getPublicStore);

// All admin store routes require admin authentication and store tenant resolution
router.use(protectAdmin);
router.use(resolveStore);

router.get("/", getStores);
router.post("/", createStore);
router.get("/current", getCurrentStore);
router.put("/current", updateCurrentStore);
router.post("/switch/:id", switchStore);
router.delete("/:id", deleteStore);

module.exports = router;
