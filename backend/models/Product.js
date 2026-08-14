const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g. "Size: M / Color: Blue"
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, default: null },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    // TENANT KEY — every query on this collection must be scoped by store.
    // The tenant-scoping middleware (see backend/middleware/tenantScope.js,
    // built Day 4) auto-injects this filter for vendor-role requests.
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [{ type: String }], // Cloudinary URLs
    variants: [variantSchema], // empty array = single-variant product
    totalStock: {
      type: Number,
      default: 0, // maintained via pre-save hook summing variant stock
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Keep totalStock in sync with variant stock so listing/search queries
// don't need to re-aggregate on every read.
productSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
  next();
});

// Compound index: store-scoped queries are the hot path (every vendor
// dashboard listing filters by store first).
productSchema.index({ store: 1, isPublished: 1 });
productSchema.index({ store: 1, slug: 1 }, { unique: true });
productSchema.index({ category: 1 });

module.exports = mongoose.model("Product", productSchema);
