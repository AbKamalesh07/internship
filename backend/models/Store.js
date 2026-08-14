const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one store per vendor in this design
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    logoUrl: {
      type: String, // Cloudinary URL
      default: null,
    },
    bannerUrl: {
      type: String, // Cloudinary URL
      default: null,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isApproved: {
      type: Boolean,
      default: false, // super admin approves new vendor stores
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

storeSchema.index({ owner: 1 });
storeSchema.index({ slug: 1 });

module.exports = mongoose.model("Store", storeSchema);
