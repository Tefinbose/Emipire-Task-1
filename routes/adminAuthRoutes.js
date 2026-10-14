const express = require("express");
const router = express.Router();

const {
  adminLogin,
  updateAdminProfile,
} = require("../controllers/adminAuthController");

const {
  protectAdmin,
} = require("../middleware/adminMiddleware");

router.post("/login", adminLogin);

// Get currently logged-in administrator profile
router.get("/profile", protectAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      currentStore: req.admin.currentStore,
      stores: req.admin.stores,
      createdAt: req.admin.createdAt,
    },
  });
});

// Update logged-in administrator profile details and password
router.put("/profile", protectAdmin, updateAdminProfile);

module.exports = router;
