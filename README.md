# Multi-Tenant E-Commerce Platform (SaaS)

MERN stack multi-vendor marketplace with role-based access control (Super Admin / Vendor / Customer) and tenant-scoped data isolation.

## Day 1 deliverables (this commit)

- `backend/models/` — Mongoose schemas: User, Store, Product, Category, Order
- `backend/config/db.js` — MongoDB connection setup
- `docs/API_ROUTE_MAP.md` — full route map with auth/scope rules per endpoint
- `docs/RBAC_MATRIX.md` — permission matrix + middleware chain design

## Tenant-scoping strategy

Every store-owned document (`Product`, `Order`) carries a `store` field. A `tenantScope` middleware (built Day 4) reads the authenticated vendor's `store` from their JWT/user record and injects it into every query — vendors never supply a storeId themselves, which is what prevents cross-tenant data leaks.

## Tech stack

React, Redux Toolkit, Tailwind CSS, React Router DOM · Node.js, Express.js · MongoDB, Mongoose · Stripe, Cloudinary, Nodemailer · JWT, Bcrypt.js, Helmet.js
