const mongoose = require("mongoose");

// Categories are platform-wide (not tenant-scoped) so products across
// different vendors can share a taxonomy for browsing/filtering.
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // null = top-level category
    },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1 });

module.exports = mongoose.model("Category", categorySchema);
