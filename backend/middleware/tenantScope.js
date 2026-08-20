// Third link in the RBAC chain: protect -> authorize(...roles) -> tenantScope.
// Must run AFTER protect and authorize(["vendor"]).
//
// This is the middleware that actually prevents cross-tenant data leaks.
// A vendor NEVER supplies their own storeId in the request — this
// middleware reads it from the authenticated user's own record and
// stamps it onto req.tenantStoreId. Controllers for store-owned
// resources (Product, Order) must always filter/set using
// req.tenantStoreId, and must NEVER trust a storeId from req.params,
// req.query, or req.body for a vendor-role request.
const tenantScope = (req, res, next) => {
  if (req.user.role !== "vendor") {
    // super_admin bypasses tenant scoping entirely (platform-wide access);
    // customer-facing routes don't use this middleware at all.
    return next();
  }

  if (!req.user.store) {
    const err = new Error(
      "This vendor account has no store yet. Create a store before accessing store-owned resources."
    );
    err.statusCode = 403;
    return next(err);
  }

  req.tenantStoreId = req.user.store;
  next();
};

module.exports = tenantScope;
