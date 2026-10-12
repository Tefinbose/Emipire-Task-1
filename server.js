
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
// const adminAuthRoutes = require("./routes/adminAuthRoutes");
// const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const productRoutes = require("./routes/productRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
// Register routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

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


// Connect to MongoDB, then start the server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
