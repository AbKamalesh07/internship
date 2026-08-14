# API Route Map

Base URL: `/api/v1`

Legend — **Auth**: none / any logged-in user / role-restricted. **Scope**: how tenant-scoping middleware filters the query.

## Auth (`/auth`)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Register as customer or vendor |
| POST | `/auth/login` | none | Login, returns access + refresh token |
| POST | `/auth/refresh` | none (refresh token) | Issue new access token |
| POST | `/auth/logout` | any | Invalidate refresh token |
| GET | `/auth/me` | any | Get current user profile |

## Stores (`/stores`)

| Method | Route | Auth | Scope | Description |
|---|---|---|---|---|
| POST | `/stores` | vendor | — | Create store (one per vendor) |
| GET | `/stores/:storeId` | none | — | Public storefront view |
| PATCH | `/stores/:storeId` | vendor (owner only) | own store | Update store settings/branding |
| GET | `/stores` | super_admin | platform-wide | List all stores (approval queue etc.) |
| PATCH | `/stores/:storeId/approve` | super_admin | platform-wide | Approve/suspend a vendor store |

## Products (`/products`)

| Method | Route | Auth | Scope | Description |
|---|---|---|---|---|
| GET | `/products` | none | published only, cross-store | Public catalog browse/search |
| GET | `/products/:id` | none | published only | Public product detail |
| POST | `/products` | vendor | auto-scoped to req.user.store | Create product |
| PATCH | `/products/:id` | vendor (owner only) | auto-scoped to req.user.store | Update product |
| DELETE | `/products/:id` | vendor (owner only) | auto-scoped to req.user.store | Delete product |
| GET | `/products/vendor/mine` | vendor | auto-scoped to req.user.store | Vendor's own product list (incl. unpublished) |

## Cart / Checkout (`/cart`, `/checkout`)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/checkout/create-payment-intent` | customer | Validates cart stock, creates Stripe PaymentIntent |
| POST | `/checkout/confirm` | customer | Creates Order(s) after payment confirmation (also handled by webhook) |
| POST | `/webhooks/stripe` | none (Stripe signature) | Stripe webhook receiver — updates order status |

## Orders (`/orders`)

| Method | Route | Auth | Scope | Description |
|---|---|---|---|---|
| GET | `/orders/mine` | customer | own orders | Customer order history |
| GET | `/orders/vendor` | vendor | auto-scoped to req.user.store | Vendor's incoming orders |
| PATCH | `/orders/:id/status` | vendor (owner only) | auto-scoped to req.user.store | Update fulfillment status |
| GET | `/orders/:id` | customer (own) or vendor (owner) or super_admin | scoped per role | Single order detail |

## Analytics (`/analytics`)

| Method | Route | Auth | Scope | Description |
|---|---|---|---|---|
| GET | `/analytics/vendor/summary` | vendor | auto-scoped to req.user.store | Revenue, order volume, top products |
| GET | `/analytics/admin/summary` | super_admin | platform-wide | Cross-store revenue, order volume, top stores |

## Categories (`/categories`)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/categories` | none | Public category list |
| POST | `/categories` | super_admin | Create category (platform-wide taxonomy) |
| PATCH | `/categories/:id` | super_admin | Update category |
