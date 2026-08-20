// Throwaway endpoints that exist purely to prove the RBAC chain works
// end-to-end before Week 2's real Product/Order/Store controllers are
// built on top of the same pattern. Safe to delete once those land.

// GET /api/v1/rbac-test/admin-only
// Reachable only by super_admin.
const adminOnly = (req, res) => {
  res.status(200).json({
    success: true,
    message: `Hello super admin ${req.user.name}, you have platform-wide access.`,
  });
};

// GET /api/v1/rbac-test/vendor-only
// Reachable only by vendor. tenantScope has already run, so
// req.tenantStoreId is guaranteed to be set here.
const vendorOnly = (req, res) => {
  res.status(200).json({
    success: true,
    message: `Hello vendor ${req.user.name}, your requests are scoped to store: ${req.tenantStoreId}`,
  });
};

// GET /api/v1/rbac-test/any-logged-in
// Reachable by any authenticated role (customer, vendor, or super_admin).
const anyLoggedIn = (req, res) => {
  res.status(200).json({
    success: true,
    message: `Hello ${req.user.name}, you are logged in as ${req.user.role}.`,
  });
};

module.exports = { adminOnly, vendorOnly, anyLoggedIn };
