const Product = require("../models/Product");
const Order = require("../models/Order");
const stripe = require("../config/stripe");

// Looks up the real product/variant for a cart line and returns the
// authoritative name/price/stock — never trusts what the client sent.
// Returns an { ok: false, message } shape instead of throwing, so the
// caller can collect every problem in the cart at once rather than
// failing on just the first bad line.
const resolveCartLine = async (line) => {
  const product = await Product.findById(line.productId);

  if (!product || !product.isPublished) {
    return { ok: false, message: `Product ${line.productId} is not available` };
  }

  if (line.variantId) {
    const variant = product.variants.id(line.variantId);
    if (!variant) {
      return { ok: false, message: `Variant not found on product "${product.name}"` };
    }
    if (variant.stock < line.quantity) {
      return {
        ok: false,
        message: `Only ${variant.stock} left of "${product.name} — ${variant.label}"`,
      };
    }
    return {
      ok: true,
      product,
      variantId: variant._id,
      name: `${product.name} — ${variant.label}`,
      price: variant.price,
      quantity: line.quantity,
      store: product.store,
    };
  }

  if (product.stock < line.quantity) {
    return { ok: false, message: `Only ${product.stock} left of "${product.name}"` };
  }

  return {
    ok: true,
    product,
    variantId: null,
    name: product.name,
    price: product.basePrice,
    quantity: line.quantity,
    store: product.store,
  };
};

// Atomically decrements stock, requiring the current stock to still be
// >= the requested quantity at the moment of the update. This is what
// actually prevents overselling under concurrent checkouts — the
// earlier read-then-check in resolveCartLine is just a fast pre-check
// for a friendly error message; this conditional update is the real guard.
const decrementStock = async (resolved) => {
  const { product, variantId, quantity } = resolved;

  if (variantId) {
    // $elemMatch is required here, not two separate dot-path conditions —
    // without it, Mongo can match "_id equals X" against one array element
    // and "stock >= quantity" against a different element, since dot-path
    // conditions on an array field aren't implicitly tied to the same item.
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

// Reverses a successful decrement — used when a later item in the same
// checkout request fails, so earlier items don't leave stock permanently
// short without an order to account for it.
const restoreStock = async (resolved) => {
  const { product, variantId, quantity } = resolved;

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

// POST /api/v1/checkout
// customer only. Note on consistency: standalone MongoDB (no replica
// set) doesn't give us multi-document transactions here, so this uses
// a decrement-with-rollback-on-failure strategy instead of a single
// atomic transaction. Each individual stock decrement IS atomic (the
// conditional $inc above), so two customers can never oversell the same
// item — but if item 3 of a 3-item cart fails, items 1 and 2 are rolled
// back manually rather than as part of one all-or-nothing commit. Good
// enough for this project's scale; a production system on a replica set
// would wrap this in a real session/transaction instead.
//
// Payment model: this is a simple (non-Connect) marketplace — ONE
// PaymentIntent is created for the customer's full cart total, covering
// every store's order from this checkout in a single charge. The
// platform collects the payment; splitting funds out to each vendor is
// out of scope for this project (would require Stripe Connect). Every
// order created here shares the same stripePaymentIntentId so the Day 14
// webhook can mark them all "paid" together when the charge succeeds.
const checkout = async (req, res, next) => {
  const decremented = []; // successfully decremented lines, for rollback on failure
  const createdOrders = []; // for cleanup if Stripe fails after orders exist

  try {
    const { items, shippingAddress } = req.body;

    // Phase 1: resolve + validate every line before touching any stock.
    const resolvedLines = [];
    const problems = [];

    for (const line of items) {
      const resolved = await resolveCartLine(line);
      if (resolved.ok) {
        resolvedLines.push(resolved);
      } else {
        problems.push(resolved.message);
      }
    }

    if (problems.length > 0) {
      const err = new Error(problems.join("; "));
      err.statusCode = 409;
      throw err;
    }

    // Phase 2: decrement stock one line at a time, rolling back on the
    // first failure (a race with another checkout since Phase 1's read).
    for (const resolved of resolvedLines) {
      const success = await decrementStock(resolved);
      if (!success) {
        for (const done of decremented) await restoreStock(done);
        const err = new Error(
          `"${resolved.name}" just sold out — please update your cart and try again`
        );
        err.statusCode = 409;
        throw err;
      }
      decremented.push(resolved);
    }

    // Phase 3: group by store and create one pending Order per store.
    const groups = new Map(); // storeId (string) -> resolved lines
    for (const line of resolvedLines) {
      const key = String(line.store);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(line);
    }

    for (const [storeId, lines] of groups) {
      const orderItems = lines.map((l) => ({
        product: l.product._id,
        variantId: l.variantId,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
      }));
      const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const order = await Order.create({
        store: storeId,
        customer: req.user._id,
        items: orderItems,
        subtotal,
        shippingAddress,
        status: "pending",
      });
      createdOrders.push(order);
    }

    // Phase 4: create ONE Stripe PaymentIntent covering every order's
    // subtotal from this checkout, then stamp its id onto each order.
    const grandTotal = createdOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const amountInCents = Math.round(grandTotal * 100);

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          customerId: String(req.user._id),
          orderIds: createdOrders.map((o) => String(o._id)).join(","),
        },
      });
    } catch (stripeErr) {
      // Stripe failed after we already committed stock + orders —
      // unwind both so the customer isn't left with phantom pending
      // orders and permanently reduced stock for a charge that never happened.
      for (const done of decremented) await restoreStock(done);
      await Order.deleteMany({ _id: { $in: createdOrders.map((o) => o._id) } });

      const err = new Error(`Payment setup failed: ${stripeErr.message}`);
      err.statusCode = 502;
      throw err;
    }

    await Order.updateMany(
      { _id: { $in: createdOrders.map((o) => o._id) } },
      { $set: { "payment.stripePaymentIntentId": paymentIntent.id } }
    );

    res.status(201).json({
      success: true,
      count: createdOrders.length,
      orders: createdOrders,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkout };
