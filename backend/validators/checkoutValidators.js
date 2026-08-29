const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Must be a valid MongoDB ObjectId");

// A single cart line as sent by the client. Deliberately minimal —
// the server never trusts a client-supplied price, name, or store.
// Those are always looked up fresh from the Product document so a
// tampered request can't check out at a fake price.
const checkoutItemSchema = z.object({
  productId: objectId,
  variantId: objectId.optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

const addressSchema = z
  .object({
    line1: z.string().trim().min(1).optional(),
    line2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    country: z.string().trim().optional(),
  })
  .optional();

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Cart cannot be empty"),
  shippingAddress: addressSchema,
});

module.exports = { checkoutSchema };
