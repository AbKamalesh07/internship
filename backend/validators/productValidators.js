const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Must be a valid MongoDB ObjectId");

// multipart/form-data sends every non-file field as a string, so a
// checkbox-style boolean arrives as the literal text "true"/"false"
// rather than a real boolean. This coerces either form into a boolean.
const booleanish = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((val) => val === true || val === "true");

const variantSchema = z.object({
  label: z.string().trim().min(1, "Variant label is required"),
  sku: z.string().trim().min(1, "Variant SKU is required"),
  price: z.coerce.number().min(0, "Variant price must be >= 0"),
  stock: z.coerce.number().int().min(0, "Variant stock must be >= 0").default(0),
  imageUrl: z.string().url().optional().nullable(),
});

// POST /products — all required fields must be present.
const createProductSchema = z
  .object({
    name: z.string().trim().min(1, "Product name is required").max(200),
    description: z.string().trim().max(5000).optional(),
    category: objectId,
    basePrice: z.coerce.number().min(0, "Base price must be >= 0"),
    images: z.array(z.string().url()).optional().default([]),
    variants: z.array(variantSchema).optional().default([]),
    // Only meaningful when variants is empty — validated further below.
    stock: z.coerce.number().int().min(0).optional().default(0),
    isPublished: booleanish.optional().default(false),
  })
  .refine(
    (data) => data.variants.length > 0 || data.stock !== undefined,
    { message: "Either variants or a flat stock count must be provided" }
  );

// PATCH /products/:id — every field optional, but whatever IS sent must
// still be valid. No .refine() needed since partial updates are allowed.
const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  category: objectId.optional(),
  basePrice: z.coerce.number().min(0).optional(),
  images: z.array(z.string().url()).optional(),
  variants: z.array(variantSchema).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  isPublished: booleanish.optional(),
});

module.exports = { createProductSchema, updateProductSchema };
