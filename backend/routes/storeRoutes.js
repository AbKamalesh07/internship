const express = require("express");
const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize");
const tenantScope = require("../middleware/tenantScope");
const {
  createStore,
  getStoreById,
  updateStore,
  listAllStores,
  approveStore,
} = require("../controllers/storeController");

const router = express.Router();

// Public
router.get("/:storeId", getStoreById);

// Vendor-only — full RBAC chain: protect -> authorize -> tenantScope
router.post("/", protect, authorize("vendor"), createStore);
router.patch(
  "/:storeId",
  protect,
  authorize("vendor"),
  tenantScope,
  updateStore
);

// Super admin only — platform-wide, no tenantScope needed
router.get("/", protect, authorize("super_admin"), listAllStores);
router.patch(
  "/:storeId/approve",
  protect,
  authorize("super_admin"),
  approveStore
);

module.exports = router;
