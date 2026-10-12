
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Read admin credentials from .env
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "Please configure ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env"
      );
    }

    if (password.length < 12) {
      throw new Error(
        "Admin password must contain at least 12 characters"
      );
    }

    // Check whether the admin already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin account already exists:", email);
      return;
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the admin account
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully!");
    console.log("Admin ID:", admin._id);
    console.log("Admin Email:", admin.email);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exitCode = 1;
  } finally {
    // Close the database connection
    await mongoose.disconnect();
  }
};

createAdmin();
