// Second link in the RBAC chain: protect -> authorize(...roles) -> tenantScope.
// Must run AFTER protect (needs req.user already attached).
//
// Usage: router.post("/products", protect, authorize("vendor"), tenantScope, createProduct);
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Not authorized, no user context found");
      err.statusCode = 401;
      return next(err);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error(
        `Role '${req.user.role}' is not permitted to perform this action`
      );
      err.statusCode = 403;
      return next(err);
    }

    next();
  };
};

module.exports = authorize;
