const express = require("express");
const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize");
const tenantScope = require("../middleware/tenantScope");
const {
  adminOnly,
  vendorOnly,
  anyLoggedIn,
} = require("../controllers/rbacTestController");

const router = express.Router();

// Full chain: protect -> authorize -> tenantScope -> controller
router.get("/admin-only", protect, authorize("super_admin"), adminOnly);
router.get("/vendor-only", protect, authorize("vendor"), tenantScope, vendorOnly);
router.get(
  "/any-logged-in",
  protect,
  authorize("super_admin", "vendor", "customer"),
  anyLoggedIn
);

module.exports = router;
