const express = require("express");
const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize");
const tenantScope = require("../middleware/tenantScope");
const validate = require("../middleware/validate");
const { createProductSchema, updateProductSchema } = require("../validators/productValidators");
const {
  createProduct,
  listPublicProducts,
  getPublicProductById,
  listMyProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

// Public — order matters: /vendor/mine must be declared before /:id,
// or Express would try to treat "vendor" as an :id param.
router.get("/", listPublicProducts);

// Vendor-only — full RBAC chain: protect -> authorize -> tenantScope
router.get("/vendor/mine", protect, authorize("vendor"), tenantScope, listMyProducts);
router.post(
  "/",
  protect,
  authorize("vendor"),
  tenantScope,
  validate(createProductSchema),
  createProduct
);
router.patch(
  "/:id",
  protect,
  authorize("vendor"),
  tenantScope,
  validate(updateProductSchema),
  updateProduct
);
router.delete("/:id", protect, authorize("vendor"), tenantScope, deleteProduct);

// Public detail route — declared last so it doesn't swallow the routes above.
router.get("/:id", getPublicProductById);

module.exports = router;
