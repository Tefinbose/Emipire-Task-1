
const express = require("express");
const cors = require("cors");

const adminAuthRoutes = require("./routes/adminAuthRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "E-commerce backend is running",
  });
});

// Admin authentication routes
app.use("/api/admin/auth", adminAuthRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the E-commerce API",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

module.exports = app;
