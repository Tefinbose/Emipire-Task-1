
const Order = require("../models/orders");

// 1. Get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email phone")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// 2. Get one order
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("items.product", "name price");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid order ID",
    });
  }
};

// 3. Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
        allowedStatuses,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      order.status === "cancelled" ||
      order.status === "delivered"
    ) {
      return res.status(400).json({
        message: "This order can no longer be updated",
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// 4. Cancel an order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      order.status === "delivered" ||
      order.status === "cancelled"
    ) {
      return res.status(400).json({
        message: "This order cannot be cancelled",
      });
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};
