
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

// 1. User places an order
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { product, quantity } = item;

      if (
        !mongoose.Types.ObjectId.isValid(product) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID or quantity",
        });
      }

      const foundProduct = await Product.findById(product);

      if (!foundProduct) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${product}`,
        });
      }

      if (!["active", "approved"].includes(foundProduct.status)) {
        return res.status(400).json({
          success: false,
          message: `${foundProduct.title || foundProduct.name || "Product"} is not available for purchase`,
        });
      }

      if (foundProduct.stock < quantity && (foundProduct.quantity || 0) < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${foundProduct.title || foundProduct.name || "Product"}`,
        });
      }

      orderItems.push({
        product: foundProduct._id,
        quantity,
        price: foundProduct.price,
      });

      totalAmount += foundProduct.price * quantity;
    }

    // Reduce stock after validating all products
    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          $or: [
            { stock: { $gte: item.quantity } },
            { quantity: { $gte: item.quantity } },
          ],
          status: { $in: ["active", "approved"] },
        },
        {
          $inc: { stock: -item.quantity, quantity: -item.quantity },
        },
        { new: true }
      );

      if (!updatedProduct) {
        // Restore stock already reduced for this order
        for (const reducedItem of orderItems) {
          if (reducedItem.product.toString() === item.product.toString()) {
            break;
          }

          await Product.updateOne(
            { _id: reducedItem.product },
            { $inc: { stock: reducedItem.quantity, quantity: reducedItem.quantity } }
          );
        }

        return res.status(409).json({
          success: false,
          message: "Product stock changed. Please try again.",
        });
      }
    }

    // Determine store context from items or request header
    let orderStoreId = req.headers["x-store-id"] || req.storeId || null;
    if (!orderStoreId && orderItems.length > 0) {
      const firstProd = await Product.findById(orderItems[0].product);
      orderStoreId = firstProd?.store || null;
    }

    try {
      const order = await Order.create({
        customer: req.user._id,
        items: orderItems,
        totalAmount,
        status: "pending",
        store: orderStoreId,
      });

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
      });
    } catch (error) {
      // Restore stock if order creation fails
      for (const item of orderItems) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity, quantity: item.quantity } }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to place order",
    });
  }
};

// 2. User views their own orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    })
      .populate("items.product", "title name price image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your orders",
    });
  }
};

// 3. Admin gets all orders
exports.getOrders = async (req, res) => {
  try {
    const storeId = req.headers["x-store-id"] || req.storeId;
    const filter = {};
    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
      filter.$or = [
        { store: storeId },
        { store: null },
        { store: { $exists: false } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("customer", "name email phone")
      .populate("items.product", "title name price image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// 4. Admin gets one order
exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("items.product", "name price");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

// 5. Admin updates order status
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
        success: false,
        message: "Invalid order status",
        allowedStatuses,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.status === "cancelled" ||
      order.status === "delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be updated",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

// 6. Admin cancels an order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.status === "delivered" ||
      order.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled",
      });
    }

    // Restore stock and quantity for each item
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity, quantity: item.quantity } }
      );
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};
