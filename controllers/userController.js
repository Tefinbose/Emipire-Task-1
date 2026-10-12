
const User = require("../models/User");

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.create({
      name,
      email,
      phone,
      role: "user",
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v");

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

// GET SINGLE USER
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(400).json({
      message: "Invalid user ID",
    });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const allowedFields = ["name", "email", "phone", "status"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide valid fields to update",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    res.status(400).json({
      message: error.message,
    });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid user ID",
    });
  }
};
