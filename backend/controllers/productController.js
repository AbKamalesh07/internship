const Product = require("../models/Product");
const { uploadImages } = require("../utils/cloudinaryUpload");

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Pulls uploaded files off req.files (populated by
// upload.fields([{ name: "images" }, { name: "variantImages" }])) and
// streams them to Cloudinary. Returns { imageUrls, variantImageUrls }.
// Either array is empty if that field wasn't part of the request.
const handleUploadedImages = async (req) => {
  const productImageFiles = req.files?.images || [];
  const variantImageFiles = req.files?.variantImages || [];

  const folder = `stores/${req.tenantStoreId}/products`;

  const [imageUrls, variantImageUrls] = await Promise.all([
    productImageFiles.length ? uploadImages(productImageFiles, folder) : [],
    variantImageFiles.length ? uploadImages(variantImageFiles, folder) : [],
  ]);

  return { imageUrls, variantImageUrls };
};

// Merges newly-uploaded variant image URLs into req.body.variants by
// index — the client is expected to send variantImages files in the
// same order as the variants array, one file per variant that needs a
// new image. A variant that already has an imageUrl in the JSON (e.g.
// unchanged on update) is left as-is.
const attachVariantImageUrls = (variants = [], variantImageUrls = []) => {
  let cursor = 0;
  return variants.map((variant) => {
    if (!variant.imageUrl && cursor < variantImageUrls.length) {
      return { ...variant, imageUrl: variantImageUrls[cursor++] };
    }
    return variant;
  });
};

// POST /api/v1/products
// vendor only. req.body has already been validated + coerced by Zod
// (validate(createProductSchema)). Product is created under
// req.tenantStoreId — never a store ID the client supplies.
const createProduct = async (req, res, next) => {
  try {
    const { name } = req.body;
    const baseSlug = slugify(name);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

    const { imageUrls, variantImageUrls } = await handleUploadedImages(req);

    const product = await Product.create({
      ...req.body,
      images: [...(req.body.images || []), ...imageUrls],
      variants: attachVariantImageUrls(req.body.variants, variantImageUrls),
      store: req.tenantStoreId,
      slug,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products
// Public catalog browse — published products only, across all stores.
// Supports simple filtering/search via query params.
const listPublicProducts = async (req, res, next) => {
  try {
    const { category, search, store, page = 1, limit = 20 } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (store) filter.store = store;
    if (search) filter.name = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("store", "name slug")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/:id
// Public. Only returns published products — an unpublished product is
// invisible to everyone except its owning vendor (see getVendorProductById).
const getPublicProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isPublished: true })
      .populate("category", "name slug")
      .populate("store", "name slug");

    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/products/vendor/mine
// vendor only. Own product list, including unpublished drafts.
// Auto-scoped to req.tenantStoreId — a vendor can never pass a different
// storeId to see another vendor's inventory.
const listMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ store: req.tenantStoreId })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/products/:id
// vendor only, own store only. The store filter in the query IS the
// tenant-isolation check — if the product belongs to another vendor's
// store, findOneAndUpdate simply matches nothing and returns null.
const updateProduct = async (req, res, next) => {
  try {
    const { imageUrls, variantImageUrls } = await handleUploadedImages(req);

    const updates = { ...req.body };
    if (imageUrls.length) {
      updates.images = [...(req.body.images || []), ...imageUrls];
    }
    if (req.body.variants) {
      updates.variants = attachVariantImageUrls(req.body.variants, variantImageUrls);
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, store: req.tenantStoreId },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      const err = new Error("Product not found in your store");
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/products/:id
// vendor only, own store only — same tenant-isolation pattern as update.
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      store: req.tenantStoreId,
    });

    if (!product) {
      const err = new Error("Product not found in your store");
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  listPublicProducts,
  getPublicProductById,
  listMyProducts,
  updateProduct,
  deleteProduct,
};
