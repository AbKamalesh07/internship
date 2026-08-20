# Multi-Tenant E-Commerce Platform (SaaS)

MERN stack multi-vendor marketplace with role-based access control (Super Admin / Vendor / Customer) and tenant-scoped data isolation.

## Day 1 deliverables (this commit)

- `backend/models/` — Mongoose schemas: User, Store, Product, Category, Order
- `backend/config/db.js` — MongoDB connection setup
- `docs/API_ROUTE_MAP.md` — full route map with auth/scope rules per endpoint
- `docs/RBAC_MATRIX.md` — permission matrix + middleware chain design

## Tenant-scoping strategy

Every store-owned document (`Product`, `Order`) carries a `store` field. A `tenantScope` middleware (built Day 4) reads the authenticated vendor's `store` from their JWT/user record and injects it into every query — vendors never supply a storeId themselves, which is what prevents cross-tenant data leaks.

## Day 2 deliverables (this commit)

- `backend/server.js` — Express app: Helmet, CORS, morgan, JSON parsing, error handling wired up
- `backend/config/db.js` — Mongoose connection (from Day 1)
- `backend/controllers/`, `backend/routes/`, `backend/middleware/` — folder structure in place; a `/api/v1/health` endpoint proves the server boots and reaches MongoDB
- `backend/.env.example` — all required environment variables documented
- `frontend/` — Vite + React scaffold, Tailwind configured, Redux Toolkit store wired, axios instance set up, App.jsx calls the backend health check to prove the full stack is connected

## Day 3 deliverables (this commit)

- `backend/utils/jwt.js` — sign/verify helpers for short-lived access tokens and long-lived refresh tokens
- `backend/middleware/protect.js` — verifies the access token on protected routes and attaches `req.user`; first link in the RBAC chain (`protect -> authorize -> tenantScope`, the rest lands Day 4)
- `backend/controllers/authController.js` — register, login, refresh, logout, `me`
- `backend/routes/authRoutes.js` — mounted at `/api/v1/auth`

### Testing Day 3 with curl / Postman

```bash
# Register
POST http://localhost:5000/api/v1/auth/register
{ "name": "Jane Vendor", "email": "jane@example.com", "password": "password123", "role": "vendor" }

# Login
POST http://localhost:5000/api/v1/auth/login
{ "email": "jane@example.com", "password": "password123" }
# -> returns { accessToken, refreshToken, user }

# Get current user (protected)
GET http://localhost:5000/api/v1/auth/me
Header: Authorization: Bearer <accessToken>

# Refresh
POST http://localhost:5000/api/v1/auth/refresh
{ "refreshToken": "<refreshToken>" }
```

## Day 4 deliverables (this commit)

- `backend/middleware/authorize.js` — role-based access control; second link in the chain
- `backend/middleware/tenantScope.js` — auto-injects `req.tenantStoreId` from the authenticated vendor's own record; this is what stops one vendor from ever seeing another vendor's data
- `backend/controllers/rbacTestController.js` + `backend/routes/rbacTestRoutes.js` — throwaway test endpoints proving the full chain works, before Week 2's real Product/Order controllers reuse the same pattern
- `docs/postman_collection_day4.json` — importable Postman collection that tests all three roles

### The full RBAC chain

```
protect          // verifies JWT, attaches req.user           (Day 3)
  -> authorize(...roles)  // 403 if req.user.role not allowed  (Day 4)
    -> tenantScope         // vendor: sets req.tenantStoreId    (Day 4)
                            // super_admin: bypassed, platform-wide access
```

Controllers for store-owned resources (Product, Order — built Week 2) must always read the scoping value from `req.tenantStoreId`, never from `req.params`/`req.body`, for vendor-role requests.

### Testing Day 4 with Postman

1. Import `docs/postman_collection_day4.json` into Postman.
2. Run requests 1–2 to register a customer and a vendor.
3. Run requests 3–4 to log in as each, then copy the `accessToken` from each response into the matching collection variable (`customerToken` / `vendorToken`) via the collection's Variables tab.
4. Run requests 5–9 in order and confirm the status codes match what's noted in each request name (200/403/401).

To test the `super_admin` role, seed one directly in MongoDB (the public `/auth/register` endpoint intentionally only allows `customer`/`vendor`):
```js
db.users.updateOne({ email: "vendor@test.com" }, { $set: { role: "super_admin" } })
```

## Running it locally

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # then fill in your own MONGO_URI etc.
npm run dev
```

**Frontend** (separate terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173` — it should show "Backend status: API is running (db: connected)" once both are running and `.env` has a valid `MONGO_URI` (a free MongoDB Atlas cluster works fine for this).

## Tech stack

React, Redux Toolkit, Tailwind CSS, React Router DOM · Node.js, Express.js · MongoDB, Mongoose · Stripe, Cloudinary, Nodemailer · JWT, Bcrypt.js, Helmet.js
