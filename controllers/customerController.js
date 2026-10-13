const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");

// 1. Get all customers with orders count and total spent
exports.getCustomers = async (req, res) => {
  try {
    const { search, status } = req.query;

    const matchConditions = {
      role: "user",
    };

    if (status && status !== "all") {
      matchConditions.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      matchConditions.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const customers = await User.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "customer",
          as: "orders",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          role: 1,
          status: 1,
          createdAt: 1,
          ordersCount: { $size: "$orders" },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    as: "ord",
                    cond: { $ne: ["$$ord.status", "cancelled"] },
                  },
                },
                as: "validOrder",
                in: "$$validOrder.totalAmount",
              },
            },
          },
          lastOrderDate: { $max: "$orders.createdAt" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

// 2. Get customer by ID along with their complete order history
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await User.findOne({ _id: id, role: "user" }).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const orders = await Order.find({ customer: id })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    const totalSpent = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      customer: {
        ...customer.toObject(),
        ordersCount: orders.length,
        totalSpent,
      },
      orders,
    });
  } catch (error) {
    console.error("Get customer by ID error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer profile",
      error: error.message,
    });
  }
};

// 3. Update customer status (active / blocked)
exports.updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'blocked'",
      });
    }

    const customer = await User.findOneAndUpdate(
      { _id: id, role: "user" },
      { status },
      { new: true }
    ).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Customer account successfully marked as ${status}`,
      customer,
    });
  } catch (error) {
    console.error("Update customer status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update customer status",
      error: error.message,
    });
  }
};
