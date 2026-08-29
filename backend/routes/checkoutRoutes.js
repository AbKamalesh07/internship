const express = require("express");
const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { checkoutSchema } = require("../validators/checkoutValidators");
const { checkout } = require("../controllers/checkoutController");

const router = express.Router();

router.post("/", protect, authorize("customer"), validate(checkoutSchema), checkout);

module.exports = router;
