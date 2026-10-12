
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin token
    if (decoded.role === "admin") {
      const admin = await Admin.findById(decoded.id);

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Admin account not found",
        });
      }

      req.user = {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      };

      return next();
    }

    // Regular user token
    const user = await User.findById(decoded.id);

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "User not found or account blocked",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
};
