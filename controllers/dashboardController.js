
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/orders");

exports.getDashboardStats = async (req, res) => {
  try {
    // Count total products
    const totalProducts = await Product.countDocuments();

    // Count registered users
    const totalUsers = await User.countDocuments({
      role: "user",
    });

    // Count total orders
    const totalOrders = await Order.countDocuments();

    // Count pending orders
    const pendingOrders = await Order.countDocuments({
      status: "pending",
    });

    // Calculate sales from delivered orders
    const salesResult = await Order.aggregate([
      {
        $match: {
          status: "delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const totalSales =
      salesResult.length > 0
        ? salesResult[0].totalSales
        : 0;

    // Return dashboard statistics
    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalUsers,
        totalOrders,
        pendingOrders,
        totalSales,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};
