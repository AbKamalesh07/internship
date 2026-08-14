# RBAC Permission Matrix

Three roles, stored on `User.role`: `super_admin`, `vendor`, `customer`.

Tenant scoping rule: whenever a **vendor** hits a store-owned resource (Product, Order, Store settings, Analytics), the `tenantScope` middleware injects `store: req.user.store` into the query automatically — the vendor never passes a storeId themselves, and cannot override it. This is what prevents Vendor A from ever seeing Vendor B's data, even by guessing IDs.

| Resource / Action | Super Admin | Vendor (own store) | Vendor (other store) | Customer | Guest |
|---|---|---|---|---|---|
| Register / Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| View public storefront/products | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create store | ❌ (not applicable) | ✅ (once) | — | ❌ | ❌ |
| Edit store settings | ✅ (any) | ✅ | ❌ | ❌ | ❌ |
| Approve/suspend store | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create/edit/delete product | ✅ (any, admin override) | ✅ | ❌ | ❌ | ❌ |
| View own product list (incl. drafts) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Add to cart / checkout | ❌ (no cart concept) | ❌ | ❌ | ✅ | ❌ (must log in) |
| View own order history | — | — | — | ✅ | ❌ |
| View/manage incoming store orders | ✅ (any) | ✅ | ❌ | ❌ | ❌ |
| Update order fulfillment status | ✅ (any) | ✅ | ❌ | ❌ | ❌ |
| View vendor analytics | ✅ (any) | ✅ | ❌ | ❌ | ❌ |
| View platform-wide analytics | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage categories | ✅ | ❌ | ❌ | ❌ | ❌ |

## Middleware chain (built Day 4)

```
protect                 // verifies JWT, attaches req.user
  -> authorize(...roles) // 403 if req.user.role not in allowed list
    -> tenantScope        // for vendor role: injects req.user.store into
                           // req.query / req.body so controllers never
                           // need to trust a client-supplied storeId
```

Controllers for store-owned resources must always read the scoping value from `req.tenantStoreId` (set by `tenantScope`), never from `req.params` or `req.body` directly, for vendor-role requests.
