# Day 10 — Vendor Inventory Workflow: Integration Test Checklist

Manual end-to-end test covering everything built Days 1–10: auth, RBAC/tenant
isolation, store creation, and the full product CRUD + image upload flow
through the actual UI (not just Postman).

Run with `mongod`, the backend (`npm run dev`), and the frontend
(`npm run dev`) all running.

## 1. Register & store setup

- [ ] Register a new vendor account at `/register` (role: Vendor) → redirected to `/dashboard`
- [ ] Refresh the page → still logged in (localStorage persistence, Day 5)
- [ ] Create a store for this vendor via Postman (`POST /api/v1/stores`) since store-creation UI isn't built yet — grab the vendor's `accessToken` from browser localStorage
- [ ] From the dashboard, click "Go to your vendor dashboard" → lands on `/vendor/products` with an empty state

## 2. Create product — no variants

- [ ] Click "Add Product" → fill name, category (a real Category `_id`), description, base price, stock
- [ ] Leave "has variants" unchecked, upload 1–2 product images
- [ ] Leave "Publish immediately" unchecked → Save
- [ ] Redirected to `/vendor/products`; new product appears in the table with the right image, price, stock, and a "Draft" badge

## 3. Create product — with variants

- [ ] Add Product → check "has variants" → add 2 variant rows (label/SKU/price/stock each)
- [ ] Upload one image per variant (both, not just one — the mixed case isn't supported yet)
- [ ] Check "Publish immediately" → Save
- [ ] Table shows this product with "2" in the Variants column and a "Published" badge; the Stock cell shows the derived `totalStock`, not an editable input (since variant stock isn't edited inline)

## 4. Inline stock quick-update (non-variant product only)

- [ ] On the first (non-variant) product's row, change the Stock number input
- [ ] A "Save" link appears → click it → shows "Saving..." then "Saved"
- [ ] Refresh the page → the new stock value persisted

## 5. Full edit flow

- [ ] Click "Edit" on the non-variant product → form pre-fills with its current name/price/description/stock and shows its existing image(s) as thumbnails
- [ ] Remove one existing image (✕ on the thumbnail), add one new image, change the price → Save Changes
- [ ] Redirected to the list; price updated, image count reflects the removal + addition
- [ ] Edit the variant product → confirm both variants' data pre-filled correctly, including their existing images shown per row
- [ ] Change one variant's price without touching its image → Save → confirm only the price changed and the image stayed the same

## 6. Delete flow

- [ ] Click "Delete" on a product → confirm dialog appears → Cancel → product remains
- [ ] Click "Delete" again → Confirm → button shows "Deleting..." → row disappears from the table
- [ ] Refresh the page → deleted product does not reappear (confirms it was actually removed server-side, not just from local state)

## 7. Tenant isolation sanity check

- [ ] Register a **second** vendor account, create a second store for it (Postman)
- [ ] Log in as vendor #2 → `/vendor/products` shows an **empty** list — none of vendor #1's products are visible
- [ ] In Postman, as vendor #2, try `PATCH /api/v1/products/<vendor 1's product id>` → expect `404 Product not found in your store` (not a 403 — the tenant filter makes it look like the product doesn't exist at all)

## 8. Auth edge cases

- [ ] Log out → try navigating directly to `/vendor/products` → redirected to `/login`
- [ ] Log in as a **customer** account → try navigating to `/vendor/products` → redirected to `/unauthorized`

If every box above checks out, the vendor inventory workflow is confirmed working end-to-end, front to back.
