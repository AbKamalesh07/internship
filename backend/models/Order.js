const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true }, // snapshot at time of order
    price: { type: Number, required: true }, // snapshot at time of order
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // TENANT KEY — an order belongs to exactly one store in this design.
    // A multi-vendor cart is split into one Order per store at checkout.
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (arr) => arr.length > 0,
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      required: true,
    },
    payment: {
      provider: { type: String, default: "stripe" },
      stripePaymentIntentId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

orderSchema.index({ store: 1, status: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
