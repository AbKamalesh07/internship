const express = require("express");
const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize");
const tenantScope = require("../middleware/tenantScope");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const parseMultipartJSON = require("../middleware/parseMultipartJSON");
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

// Accepts a product's main images plus each variant's image in one
// multipart request. Field names the client must use:
//   "images"         -> product-level gallery images (up to 6)
//   "variantImages"  -> one per variant that needs a new image, sent in
//                        the same order as the `variants` JSON array
const productImageUpload = upload.fields([
  { name: "images", maxCount: 6 },
  { name: "variantImages", maxCount: 8 },
]);

// Public — order matters: /vendor/mine must be declared before /:id,
// or Express would try to treat "vendor" as an :id param.
router.get("/", listPublicProducts);

// Vendor-only — full chain: protect -> authorize -> tenantScope ->
// multer (parses multipart, populates req.files) -> parseMultipartJSON
// (turns the "variants" JSON string back into an array) -> Zod validate
router.get("/vendor/mine", protect, authorize("vendor"), tenantScope, listMyProducts);
router.post(
  "/",
  protect,
  authorize("vendor"),
  tenantScope,
  productImageUpload,
  parseMultipartJSON,
  validate(createProductSchema),
  createProduct
);
router.patch(
  "/:id",
  protect,
  authorize("vendor"),
  tenantScope,
  productImageUpload,
  parseMultipartJSON,
  validate(updateProductSchema),
  updateProduct
);
router.delete("/:id", protect, authorize("vendor"), tenantScope, deleteProduct);

// Public detail route — declared last so it doesn't swallow the routes above.
router.get("/:id", getPublicProductById);

module.exports = router;
