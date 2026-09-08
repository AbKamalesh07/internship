const Product = require("../models/Product");

// Atomically decrements stock, requiring the current stock to still be
// >= the requested quantity at the moment of the update. This is what
// actually prevents overselling under concurrent checkouts — a
// read-then-check earlier in the flow is just a fast pre-check for a
// friendly error message; this conditional update is the real guard.
//
// $elemMatch is required for the variant case, not two separate
// dot-path conditions — without it, Mongo can match "_id equals X"
// against one array element and "stock >= quantity" against a
// *different* element, since dot-path conditions on an array field
// aren't implicitly tied to the same item.
const decrementStock = async ({ product, variantId, quantity }) => {
  if (variantId) {
    const result = await Product.updateOne(
      { _id: product._id, variants: { $elemMatch: { _id: variantId, stock: { $gte: quantity } } } },
      { $inc: { "variants.$.stock": -quantity, totalStock: -quantity } }
    );
    return result.modifiedCount === 1;
  }

  const result = await Product.updateOne(
    { _id: product._id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity, totalStock: -quantity } }
  );
  return result.modifiedCount === 1;
};

// Reverses a decrement — used both when a later item in the same
// checkout request fails (Day 12) and when a payment ultimately fails
// after stock was already reserved at checkout time (Day 14's webhook).
const restoreStock = async ({ product, variantId, quantity }) => {
  if (variantId) {
    await Product.updateOne(
      { _id: product._id, "variants._id": variantId },
      { $inc: { "variants.$.stock": quantity, totalStock: quantity } }
    );
  } else {
    await Product.updateOne(
      { _id: product._id },
      { $inc: { stock: quantity, totalStock: quantity } }
    );
  }
};

module.exports = { decrementStock, restoreStock };
