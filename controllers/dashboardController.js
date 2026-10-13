const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");

// 1. Dashboard summary stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });

    const salesResult = await Order.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;

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

// 2. Comprehensive Shopify-grade Analytics data
exports.getAnalyticsData = async (req, res) => {
  try {
    const { range = "30d" } = req.query;

    const now = new Date();
    let startDate = new Date();

    if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else {
      // 1 year
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // A. Daily Sales Time Series for non-cancelled orders
    const timeSeriesAggregation = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format sales time-series into friendly chart labels
    const salesOverTime = timeSeriesAggregation.map((item) => {
      const dateObj = new Date(item._id);
      const label = dateObj.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      return {
        date: item._id,
        label,
        sales: item.sales,
        orders: item.orders,
      };
    });

    // B. Overall KPI Totals within the date window
    const kpiAggregation = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          grossSales: {
            $sum: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
            },
          },
          deliveredSales: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$totalAmount", 0],
            },
          },
          deliveredCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          cancelledCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const kpi = kpiAggregation[0] || {
      totalOrders: 0,
      grossSales: 0,
      deliveredSales: 0,
      deliveredCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    const validOrderCount = kpi.totalOrders - kpi.cancelledCount;
    const aov = validOrderCount > 0 ? Math.round(kpi.grossSales / validOrderCount) : 0;
    const fulfillmentRate =
      kpi.totalOrders > 0
        ? Math.round((kpi.deliveredCount / kpi.totalOrders) * 100)
        : 100;

    // C. Top 5 Best-Selling Products
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          unitsSold: { $sum: "$items.quantity" },
          revenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$product.name", "Product Unavailable"] },
          image: { $ifNull: ["$product.image", ""] },
          category: { $ifNull: ["$product.category", "General"] },
          price: { $ifNull: ["$product.price", 0] },
          unitsSold: 1,
          revenue: 1,
        },
      },
    ]);

    // D. Category Sales Distribution
    const categoryDistribution = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$product.category", "General"] },
          revenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          units: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
      {
        $project: {
          category: "$_id",
          revenue: 1,
          units: 1,
        },
      },
    ]);

    // E. Orders by Status
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
        },
      },
    ]);

    // F. Customer Metrics
    const totalCustomers = await User.countDocuments({ role: "user" });

    // Repeat customers (more than 1 order)
    const repeatCustomerStats = await Order.aggregate([
      {
        $group: {
          _id: "$customer",
          orderCount: { $sum: 1 },
        },
      },
      {
        $match: {
          orderCount: { $gt: 1 },
        },
      },
      {
        $count: "repeatCustomers",
      },
    ]);

    const repeatCustomers =
      repeatCustomerStats.length > 0
        ? repeatCustomerStats[0].repeatCustomers
        : 0;

    const repeatCustomerRate =
      totalCustomers > 0
        ? Math.round((repeatCustomers / totalCustomers) * 100)
        : 0;

    res.status(200).json({
      success: true,
      range,
      kpis: {
        grossSales: kpi.grossSales,
        deliveredSales: kpi.deliveredSales,
        totalOrders: kpi.totalOrders,
        deliveredCount: kpi.deliveredCount,
        pendingCount: kpi.pendingCount,
        cancelledCount: kpi.cancelledCount,
        aov,
        fulfillmentRate,
        totalCustomers,
        repeatCustomers,
        repeatCustomerRate,
      },
      salesOverTime,
      topProducts,
      categoryDistribution,
      statusDistribution,
    });
  } catch (error) {
    console.error("Analytics endpoint error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to compile store analytics",
      error: error.message,
    });
  }
};
