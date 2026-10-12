
const express = require("express");
const router = express.Router();

const {
  adminLogin,
} = require("../controllers/adminAuthController");

const {
  protectAdmin,
} = require("../middleware/adminMiddleware");

router.post("/login", adminLogin);

router.get("/profile", protectAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
    },
  });
});

module.exports = router;
