const mongoose = require("mongoose");
const Collection = require("../models/Collection");
const Product = require("../models/Product");

// 1. Get all collections
const getCollections = async (req, res) => {
  try {
    const { search, type, published, sort = "createdAt", order = "desc" } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }, { handle: searchRegex }];
    }

    if (type && ["manual", "automated"].includes(type)) {
      filter.type = type;
    }

    if (published !== undefined) {
      filter.published = published === "true";
    }

    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;

    const collections = await Collection.find(filter)
      .sort(sortOptions)
      .populate("products", "title name price image status");

    const formatted = collections.map((col) => ({
      ...col.toObject(),
      productsCount: col.products?.length || 0,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      collections: formatted,
    });
  } catch (error) {
    console.error("Get collections error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch collections",
    });
  }
};

// 2. Get single collection by ID or handle
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { handle: id.toLowerCase() };
    }

    const collection = await Collection.findOne(query).populate(
      "products",
      "title name price image compareAtPrice status stock quantity category"
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("Get collection error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch collection",
    });
  }
};

// 3. Create a collection
const createCollection = async (req, res) => {
  try {
    const {
      title,
      description,
      handle,
      type = "manual",
      rules,
      disjunctive,
      products,
      image,
      sortOrder,
      published = true,
      seo,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Collection title is required",
      });
    }

    const newCollection = new Collection({
      title: title.trim(),
      description: description || "",
      handle: handle?.trim()?.toLowerCase() || undefined,
      type,
      rules: Array.isArray(rules) ? rules : [],
      disjunctive: Boolean(disjunctive),
      products: Array.isArray(products) ? products : [],
      image: image || { url: "", altText: "" },
      sortOrder: sortOrder || "best-selling",
      published: Boolean(published),
      seo: seo || { pageTitle: "", metaDescription: "", urlHandle: "" },
    });

    await newCollection.save();

    // If manual products were passed, link this collection to them
    if (Array.isArray(products) && products.length > 0) {
      await Product.updateMany(
        { _id: { $in: products } },
        { $addToSet: { collections: newCollection._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Collection created successfully",
      collection: newCollection,
    });
  } catch (error) {
    console.error("Create collection error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create collection",
    });
  }
};

// 4. Update a collection
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID",
      });
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "handle",
      "type",
      "rules",
      "disjunctive",
      "products",
      "image",
      "sortOrder",
      "published",
      "seo",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        collection[field] = req.body[field];
      }
    });

    await collection.save();

    res.status(200).json({
      success: true,
      message: "Collection updated successfully",
      collection,
    });
  } catch (error) {
    console.error("Update collection error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update collection",
    });
  }
};

// 5. Delete a collection
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID",
      });
    }

    const deleted = await Collection.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    // Remove reference from products
    await Product.updateMany(
      { collections: id },
      { $pull: { collections: id } }
    );

    res.status(200).json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("Delete collection error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete collection",
    });
  }
};

module.exports = {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};
