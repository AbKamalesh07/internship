const express = require("express");
const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize");
const { listMyOrders, getOrderById } = require("../controllers/orderController");

const router = express.Router();

router.get("/mine", protect, authorize("customer"), listMyOrders);
router.get("/:id", protect, authorize("customer", "vendor", "super_admin"), getOrderById);

module.exports = router;
