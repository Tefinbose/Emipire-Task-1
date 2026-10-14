const mongoose = require("mongoose");
const Product = require("../models/Product");
const Collection = require("../models/Collection");

// 1. Get products (with filtering, search, sorting, and pagination)
const getProducts = async (req, res) => {
  try {
    const {
      search,
      status,
      category,
      vendor,
      productType,
      collection,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    const andConditions = [];

    // Filter by store context if provided
    const storeHeader = req.headers["x-store-id"] || req.query.storeId || req.storeId;
    if (storeHeader && mongoose.Types.ObjectId.isValid(storeHeader)) {
      andConditions.push({
        $or: [
          { store: storeHeader },
          { store: null },
          { store: { $exists: false } },
        ],
      });
    }

    // Filter by status if provided (active, draft, unlisted, archived, etc.)
    if (status) {
      if (status === "active") {
        andConditions.push({
          $or: [
            { status: "active" },
            { status: "approved" },
            { status: { $exists: false } },
            { status: null },
          ],
        });
      } else {
        andConditions.push({ status });
      }
    }

    // Filter by category
    if (category) {
      andConditions.push({ category: new RegExp(category.trim(), "i") });
    }

    // Filter by vendor
    if (vendor) {
      andConditions.push({ vendor: new RegExp(vendor.trim(), "i") });
    }

    // Filter by productType
    if (productType) {
      andConditions.push({ productType: new RegExp(productType.trim(), "i") });
    }

    // Filter by collection
    if (collection && mongoose.Types.ObjectId.isValid(collection)) {
      andConditions.push({ collections: collection });
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        priceFilter.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        priceFilter.$lte = Number(maxPrice);
      }
      andConditions.push({ price: priceFilter });
    }

    // Search query across title, name, tags, sku, barcode, vendor, description
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      andConditions.push({
        $or: [
          { title: searchRegex },
          { name: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
          { vendor: searchRegex },
          { sku: searchRegex },
          { barcode: searchRegex },
          { category: searchRegex },
          { "variants.title": searchRegex },
          { "variants.sku": searchRegex },
        ],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    // Sort order
    const sortOptions = {};
    const sortField = sortBy === "name" ? "title" : sortBy;
    sortOptions[sortField] = order === "asc" ? 1 : -1;

    // Pagination
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNumber - 1) * pageSize;

    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate("collections", "title handle")
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: pageNumber,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get single product by ID or handle
const getProductById = async (req, res) => {
  try {
    const identifier = req.params.id || req.params.handle;

    let product = null;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier).populate("collections", "title handle");
    }

    // Fallback: search by Shopify handle or SEO handle
    if (!product) {
      product = await Product.findOne({
        $or: [{ handle: identifier }, { "seo.urlHandle": identifier }],
      }).populate("collections", "title handle");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product by ID error:", error.message);
    res.status(400).json({
      success: false,
      message: "Invalid product identifier",
    });
  }
};

// 3. Create product (Admin) with complete Shopify fields
const createProduct = async (req, res) => {
  try {
    const {
      title,
      name,
      description,
      status = "active",
      publishing,
      productType,
      vendor,
      category,
      collections,
      tags,
      themeTemplate,
      media,
      image,
      price,
      compareAtPrice,
      unitPrice,
      chargeTax,
      costPerItem,
      inventoryTracked,
      quantity,
      stock,
      inventoryLocations,
      sku,
      barcode,
      continueSellingOutOfStock,
      isPhysicalProduct,
      packageType,
      packageDimensions,
      weight,
      weightUnit,
      countryOfOrigin,
      hsCode,
      hasVariants,
      options,
      variants,
      metafields,
      seo,
      handle,
    } = req.body;

    const productTitle = title || name;

    if (!productTitle) {
      return res.status(400).json({
        success: false,
        message: "Product title is required",
      });
    }

    if (price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({
        success: false,
        message: "Valid product price is required",
      });
    }

    const newProductData = {
      title: productTitle.trim(),
      name: productTitle.trim(),
      description: description || "",
      status: ["active", "draft", "unlisted", "archived", "approved"].includes(status)
        ? status
        : "active",
      publishing: publishing || {
        allChannels: true,
        salesChannels: ["Online Store", "Point of Sale"],
        publishedAt: new Date(),
      },
      productType: productType || "",
      vendor: vendor || "",
      category: category || "",
      collections: Array.isArray(collections) ? collections : [],
      tags: Array.isArray(tags) ? tags : [],
      themeTemplate: themeTemplate || "Default product",
      media: Array.isArray(media) ? media : [],
      image: image || (Array.isArray(media) && media.length > 0 ? media[0].url : ""),
      price: Number(price),
      compareAtPrice:
        compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== ""
          ? Number(compareAtPrice)
          : null,
      unitPrice: unitPrice || { amount: null, measurementUnit: "" },
      chargeTax: chargeTax !== undefined ? Boolean(chargeTax) : true,
      costPerItem: Number(costPerItem) || 0,
      inventoryTracked: inventoryTracked !== undefined ? Boolean(inventoryTracked) : true,
      quantity: Number(quantity !== undefined ? quantity : stock) || 0,
      stock: Number(stock !== undefined ? stock : quantity) || 0,
      inventoryLocations: Array.isArray(inventoryLocations) ? inventoryLocations : [],
      sku: sku || "",
      barcode: barcode || "",
      continueSellingOutOfStock: Boolean(continueSellingOutOfStock),
      isPhysicalProduct: isPhysicalProduct !== undefined ? Boolean(isPhysicalProduct) : true,
      packageType: packageType || "Store default",
      packageDimensions: packageDimensions || { length: 0, width: 0, height: 0, unit: "cm" },
      weight: Number(weight) || 0,
      weightUnit: weightUnit || "kg",
      countryOfOrigin: countryOfOrigin || "",
      hsCode: hsCode || "",
      hasVariants: Boolean(hasVariants),
      options: Array.isArray(options) ? options : [],
      variants: Array.isArray(variants) ? variants : [],
      metafields: Array.isArray(metafields) ? metafields : [],
      seo: seo || { pageTitle: "", metaDescription: "", urlHandle: "" },
      handle: handle || "",
      store: req.headers["x-store-id"] || req.storeId || req.user?.currentStore || null,
      createdBy: req.user?._id || req.user?.id || null,
      addedBy: null,
    };

    const product = new Product(newProductData);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Update product (Admin)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const allowedFields = [
      "title",
      "name",
      "description",
      "status",
      "publishing",
      "productType",
      "vendor",
      "category",
      "collections",
      "tags",
      "themeTemplate",
      "media",
      "image",
      "price",
      "compareAtPrice",
      "unitPrice",
      "chargeTax",
      "costPerItem",
      "inventoryTracked",
      "quantity",
      "stock",
      "inventoryLocations",
      "sku",
      "barcode",
      "continueSellingOutOfStock",
      "isPhysicalProduct",
      "packageType",
      "packageDimensions",
      "weight",
      "weightUnit",
      "countryOfOrigin",
      "hsCode",
      "hasVariants",
      "options",
      "variants",
      "metafields",
      "seo",
      "handle",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }

    // Keep name and title synced
    if (req.body.title) {
      product.name = req.body.title;
    } else if (req.body.name) {
      product.title = req.body.name;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Delete product (Admin)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Duplicate product (Shopify Admin clone feature)
const duplicateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const originalProduct = await Product.findById(id).lean();

    if (!originalProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { _id, createdAt, updatedAt, __v, ...cloneData } = originalProduct;

    const copyTitle = `Copy of ${cloneData.title || cloneData.name}`;
    const copyTimestamp = Date.now().toString().slice(-4);
    const copyHandle = `${cloneData.handle || "product"}-copy-${copyTimestamp}`;
    const copySku = cloneData.sku ? `${cloneData.sku}-COPY-${copyTimestamp}` : "";

    const copyVariants = (cloneData.variants || []).map((v) => {
      const { _id, ...vRest } = v;
      return {
        ...vRest,
        sku: v.sku ? `${v.sku}-COPY-${copyTimestamp}` : "",
        barcode: "",
      };
    });

    const duplicatedProduct = new Product({
      ...cloneData,
      title: copyTitle,
      name: copyTitle,
      sku: copySku,
      barcode: "",
      status: "draft",
      handle: copyHandle,
      variants: copyVariants,
      seo: {
        ...(cloneData.seo || {}),
        urlHandle: copyHandle,
      },
    });

    await duplicatedProduct.save();

    res.status(201).json({
      success: true,
      message: "Product duplicated successfully as draft",
      product: duplicatedProduct,
    });
  } catch (error) {
    console.error("Duplicate product error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. Bulk update status (Admin)
const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required",
      });
    }

    const validStatuses = ["active", "draft", "unlisted", "archived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );

    res.status(200).json({
      success: true,
      message: `Updated status to '${status}' for ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk status error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8. Bulk delete products (Admin)
const bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required",
      });
    }

    const result = await Product.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} products`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 9. Backward compatibility: user submits product
const addProductByUser = async (req, res) => {
  try {
    const { name, title, description, price, category, stock, quantity, image } = req.body;
    const productTitle = title || name;

    if (!productTitle || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title and price are required",
      });
    }

    const product = new Product({
      title: productTitle,
      name: productTitle,
      description: description || "",
      price: Number(price),
      category: category || "",
      quantity: Number(quantity !== undefined ? quantity : stock) || 0,
      stock: Number(stock !== undefined ? stock : quantity) || 0,
      image: image || "",
      addedBy: req.user?._id || null,
      status: "active",
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("User add product error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 10. Backward compatibility: user views their own products
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      addedBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get my products error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  bulkUpdateStatus,
  bulkDeleteProducts,
  addProductByUser,
  getMyProducts,
};
