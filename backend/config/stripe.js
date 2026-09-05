const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  // Not throwing here — lets the rest of the app (and other routes) boot
  // fine in dev before Stripe keys are filled in. The checkout route
  // itself will fail loudly and clearly if a real payment is attempted
  // without a key configured.
  console.warn("STRIPE_SECRET_KEY is not set — payment routes will fail until it is.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
