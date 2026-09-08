const express = require("express");
const { handleStripeWebhook } = require("../controllers/webhookController");

const router = express.Router();

// NOTE: the express.raw() body parser for this route is applied in
// server.js, not here — it must be registered before the global
// express.json() middleware, which this router alone can't guarantee.
router.post("/stripe", handleStripeWebhook);

module.exports = router;
