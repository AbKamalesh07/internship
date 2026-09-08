const stripe = require("../config/stripe");
const Order = require("../models/Order");
const { restoreStock } = require("../utils/stockAdjust");

// POST /api/v1/webhooks/stripe
// No auth middleware — Stripe calls this directly, authenticated instead
// by the signature header below. req.body here is the RAW request buffer
// (see server.js: this route is mounted with express.raw(), BEFORE the
// global express.json() middleware — signature verification fails if the
// body has already been parsed/re-serialized by anything else first).
const handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Signature mismatch or malformed payload — reject before touching
    // the database. Logged server-side; the 400 tells Stripe not to retry
    // (it isn't going to become valid on retry).
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await Order.updateMany(
          { "payment.stripePaymentIntentId": paymentIntent.id, status: "pending" },
          { $set: { status: "paid", "payment.paidAt": new Date() } }
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const orders = await Order.find({
          "payment.stripePaymentIntentId": paymentIntent.id,
          status: "pending",
        });

        // Stock was reserved (decremented) at checkout time, before
        // payment was confirmed — a failed payment means that reservation
        // never turned into a sale, so it has to be given back.
        for (const order of orders) {
          for (const item of order.items) {
            await restoreStock({
              product: { _id: item.product },
              variantId: item.variantId,
              quantity: item.quantity,
            });
          }
        }

        await Order.updateMany(
          { "payment.stripePaymentIntentId": paymentIntent.id, status: "pending" },
          { $set: { status: "cancelled" } }
        );
        break;
      }

      default:
        // Other event types (e.g. charge.refunded) aren't handled yet —
        // acknowledging with 200 below tells Stripe not to retry them.
        break;
    }

    // Stripe expects a fast 2xx to confirm receipt — always send it once
    // the signature is valid, even for event types we don't act on.
    res.status(200).json({ received: true });
  } catch (err) {
    // Something went wrong applying the event (e.g. a DB hiccup) — a
    // non-2xx here makes Stripe retry this same webhook automatically.
    console.error("Error processing Stripe webhook:", err);
    res.status(500).json({ received: false });
  }
};

module.exports = { handleStripeWebhook };
