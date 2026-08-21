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

## Day 5 deliverables (this commit)

- `frontend/src/features/auth/authSlice.js` — Redux Toolkit slice: stores `user`, `accessToken`, `refreshToken`; async thunks for `registerUser`/`loginUser`/`logoutUser`; persists to `localStorage` so a page refresh doesn't log the user out
- `frontend/src/api/axios.js` — request interceptor attaches the access token to every call; response interceptor auto-refreshes on a `401` and retries the original request once, forcing logout only if the refresh itself fails
- `frontend/src/pages/auth/LoginPage.jsx`, `RegisterPage.jsx` — forms wired to the auth slice
- `frontend/src/routes/ProtectedRoute.jsx` — redirects to `/login` if not authenticated; optionally gates by `allowedRoles`
- `frontend/src/pages/DashboardPage.jsx`, `UnauthorizedPage.jsx` — placeholder landing pages (real per-role dashboards land Week 2+)
- `frontend/src/App.jsx` — full route table using React Router

### Testing Day 5

```bash
cd backend && npm run dev      # terminal 1
cd frontend && npm run dev     # terminal 2
```
Visit `http://localhost:5173` → redirects to `/login` → register a new account → redirects to `/dashboard` on success → refresh the page and confirm you're still logged in (localStorage persistence) → click "Log out."

## Day 6 deliverables (this commit)

- `backend/controllers/storeController.js` — `createStore`, `getStoreById`, `updateStore` (vendor, own store only), `listAllStores`, `approveStore` (super_admin only)
- `backend/routes/storeRoutes.js` — mounted at `/api/v1/stores`, using the full RBAC chain (`protect -> authorize -> tenantScope`) on vendor routes
- `backend/server.js` — wired in

### Store routes

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/stores` | vendor | Creates the vendor's one store, links it to their user record |
| GET | `/api/v1/stores/:storeId` | public | View any storefront |
| PATCH | `/api/v1/stores/:storeId` | vendor (owner only) | `tenantScope` + an explicit param check stop a vendor editing another store |
| GET | `/api/v1/stores` | super_admin | Platform-wide list, e.g. approval queue |
| PATCH | `/api/v1/stores/:storeId/approve` | super_admin | Toggle `isApproved`/`isActive` |

### Testing Day 6

```bash
# 1. Register + login a vendor (from Day 3), grab the accessToken
# 2. Create a store
POST http://localhost:5000/api/v1/stores
Header: Authorization: Bearer <vendorAccessToken>
{ "name": "Vera's Vintage Finds", "description": "Curated vintage goods", "contactEmail": "vera@example.com" }

# 3. Try creating a second store as the same vendor -> expect 409
# 4. View it publicly (no token needed)
GET http://localhost:5000/api/v1/stores/<storeId>

# 5. Update it as the owner -> expect 200
PATCH http://localhost:5000/api/v1/stores/<storeId>
Header: Authorization: Bearer <vendorAccessToken>
{ "description": "Updated description" }
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
