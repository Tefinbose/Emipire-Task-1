const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");

// 1. Get all discounts with search and status filtering
exports.getDiscounts = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { code: searchRegex },
        { description: searchRegex },
      ];
    }

    const now = new Date();

    if (status && status !== "all") {
      if (status === "expired") {
        filter.endDate = { $ne: null, $lt: now };
      } else if (status === "active") {
        filter.status = "active";
        filter.$or = [{ endDate: null }, { endDate: { $gte: now } }];
      } else if (status === "disabled") {
        filter.status = "disabled";
      }
    }

    const rawDiscounts = await Coupon.find(filter).sort({ createdAt: -1 });

    // Enhance each discount with computed state (isExpired)
    const discounts = rawDiscounts.map((d) => {
      const obj = d.toObject();
      const isExpired = obj.endDate ? new Date(obj.endDate) < now : false;
      const isMaxedOut =
        obj.usageLimit !== null && obj.usageLimit !== undefined
          ? obj.usageCount >= obj.usageLimit
          : false;

      let effectiveStatus = obj.status;
      if (isExpired) effectiveStatus = "expired";
      else if (isMaxedOut) effectiveStatus = "maxed_out";

      return {
        ...obj,
        isExpired,
        isMaxedOut,
        effectiveStatus,
      };
    });

    res.status(200).json({
      success: true,
      count: discounts.length,
      discounts,
    });
  } catch (error) {
    console.error("Get discounts error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch discounts",
      error: error.message,
    });
  }
};

// 2. Get discount by ID
exports.getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount ID",
      });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Discount coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch discount",
      error: error.message,
    });
  }
};

// 3. Create a new discount coupon
exports.createDiscount = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      endDate,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Discount code is required",
      });
    }

    const cleanCode = code.trim().toUpperCase();

    if (discountValue === undefined || discountValue === null || Number(discountValue) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A positive discount value is required",
      });
    }

    if (discountType === "percentage" && Number(discountValue) > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${cleanCode}' already exists`,
      });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description ? description.trim() : "",
      discountType: discountType || "percentage",
      discountValue: Number(discountValue),
      minPurchaseAmount: minPurchaseAmount ? Number(minPurchaseAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Discount coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create discount error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create discount",
      error: error.message,
    });
  }
};

// 4. Update an existing discount coupon
exports.updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount ID",
      });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Discount coupon not found",
      });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      endDate,
      status,
    } = req.body;

    if (code) {
      const cleanCode = code.trim().toUpperCase();
      const existing = await Coupon.findOne({
        code: cleanCode,
        _id: { $ne: coupon._id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Coupon code '${cleanCode}' is already in use`,
        });
      }
      coupon.code = cleanCode;
    }

    if (description !== undefined) coupon.description = description.trim();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minPurchaseAmount !== undefined) coupon.minPurchaseAmount = Number(minPurchaseAmount);
    if (maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    }
    if (usageLimit !== undefined) {
      coupon.usageLimit = usageLimit ? Number(usageLimit) : null;
    }
    if (endDate !== undefined) {
      coupon.endDate = endDate ? new Date(endDate) : null;
    }
    if (status && ["active", "disabled"].includes(status)) {
      coupon.status = status;
    }

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Discount updated successfully",
      coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update discount",
      error: error.message,
    });
  }
};

// 5. Toggle coupon status (active / disabled)
exports.toggleDiscountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount ID",
      });
    }

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'active' or 'disabled'",
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Discount coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Coupon status set to ${status}`,
      coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change coupon status",
      error: error.message,
    });
  }
};

// 6. Delete coupon
exports.deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount ID",
      });
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Discount coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Discount coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete discount",
      error: error.message,
    });
  }
};

// 7. Validate coupon for checkout (Public/Customer friendly)
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal = 0 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    if (coupon.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This coupon is currently inactive or disabled",
      });
    }

    const now = new Date();
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its maximum redemption limit",
      });
    }

    const subtotal = Number(cartTotal) || 0;
    if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order subtotal of ₹${coupon.minPurchaseAmount} is required to apply ${coupon.code}`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      // Fixed amount
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    const newTotal = Math.max(0, subtotal - discountAmount);

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      newTotal: Math.round(newTotal * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
      error: error.message,
    });
  }
};
