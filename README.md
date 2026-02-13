# Shirt Store Backend

Demo REST API for a store backend, built with Express, TypeScript, Prisma, and PostgreSQL. It exposes catalog endpoints (banners, products, categories), user registration/login, address management, and a cart + checkout flow with Stripe. The project is structured around controllers/services and Zod validation, so it’s easy to extend the domain and swap parts of the flow as the app grows.

---

## 1. Overview

- **Public catalog**: list banners, products, single product details, related products, and basic category metadata.
- **User accounts**: registration and login with hashed passwords and token-based authentication.
- **Addresses**: create and list user delivery addresses (authenticated).
- **Cart and checkout**: build cart from product IDs, calculate a fixed shipping fee, create orders, and generate Stripe checkout sessions.
- **Orders**: list a user's orders and retrieve order details with product image URLs.
- **Stripe webhook**: update order status based on Stripe checkout session events.

---

## 2. Tech Stack

- **Framework**: Express 5
- **ORM**: Prisma with PostgreSQL
- **Auth**: UUID tokens + bcryptjs for password hashing
- **Validation**: Zod
- **Payments**: Stripe

---

## 3. Project Structure

- **`src/server.ts`**: Express app initialization, CORS, static `public` directory, body parsers (JSON, raw for Stripe), global error handler, and server start.
- **`src/routes/main.ts`**: Central router that wires all HTTP routes to controllers. Applies `authMiddleware` on protected routes.
- **`src/controllers`**:
  - `banner.ts`: handles `/banners`.
  - `product.ts`: handles `/products`, `/product/:id`, `/product/:id/related`.
  - `category.ts`: handles `/category/:slug/metadata`.
  - `cart.ts`: handles `/cart/mount`, `/cart/shipping`, `/cart/finish`.
  - `user.ts`: handles `/user/register`, `/user/login`, `/user/addresses`.
  - `order.ts`: handles `/orders/session`, `/orders`, `/orders/:id`.
  - `webhook.ts`: handles `/webhook/stripe` (Stripe webhook endpoint).
- **`src/services`**:
  - `banner.ts`, `product.ts`, `category.ts`: Prisma-based catalog queries.
  - `user.ts`: user creation, login, token management, address persistence.
  - `order.ts`: order creation, status updates, user order listing and detail retrieval.
  - `payment.ts`: coordination with Stripe library for checkout sessions and session lookup.
- **`src/middlewares/auth.ts`**: Token-based auth middleware using `Authorization: Bearer <token>`.
- **`src/libs`**:
  - `prisma.ts`: Prisma client initialization with PostgreSQL adapter and global reuse.
  - `stripe.ts`: Stripe client initialization and helpers (checkout session creation, webhook event construction, session retrieval).
- **`src/utils`**: Helpers to read env-based configuration and build absolute URLs (`get-base-url`, `get-absolute-image-url`, `get-stripe-secret-key`, `get-stripe-webhook-secret`, `get-frontend-url`).
- **`src/schemas`**: Zod schemas for validating request bodies, params, and queries (register, login, address, cart, shipping, product filters, order IDs, session IDs).
- **`src/types`**: Shared TypeScript types for `Address` and `CartItem`.
- **`src/generated/prisma`**: Generated Prisma client and model typings (do not edit manually).
- **`prisma/schema.prisma`**: Database schema (tables/models and relations).
- **`prisma/seed.ts`**: Seed script for initial categories, metadata, banners, products, and images.
- **`prisma.config.ts`**: Prisma configuration, including schema path, migrations folder, seed command, and datasource URL.
- **`.env`**: Local environment variables for database connection, URLs, and Stripe credentials.

---

## 4. Running Locally

### Prerequisites

- **Node.js** and **npm** installed.
- **PostgreSQL** instance available and reachable by the `DATABASE_URL` connection string.
- **Stripe** account with:
  - Secret key for API calls.
  - Webhook signing secret for the configured webhook endpoint.

### Installation

From the project root:

```bash
npm install
```

### Environment setup

Create a `.env` file in the project root with the variables listed in the **Environment Variables** section below, using values appropriate for your local environment.

You will need:

- A valid `DATABASE_URL` pointing to your PostgreSQL database.
- A valid `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- A `FRONTEND_URL` that matches the frontend you are using for redirects.

### Prisma setup

From the project root:
```bash
npx prisma migrate dev
npx prisma generate
```

### Database setup

- **Prisma schema** is defined in `prisma/schema.prisma`.
- **Seed data** is configured in `prisma/seed.ts` and wired via `prisma.config.ts`.

To seed the database with initial data (categories, banners, products, images, metadata):

```bash
npm run db:seed
```

### Start command

Run the API in development mode:

```bash
npm run dev
```

By default, the server listens on `PORT` from the environment or `4000` if not set.

---

## 5. Environment Variables

| Variable                | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `PORT`                  | Port on which the HTTP server listens (defaults to `4000` if unset).                 |
| `BASE_URL`              | Base URL used to build absolute image URLs (fallback is `http://localhost:4000`).    |
| `FRONTEND_URL`          | Frontend base URL used in Stripe success and cancel redirect URLs.                   |
| `DATABASE_URL`          | PostgreSQL connection string used by Prisma and the `pg` pool.                       |
| `STRIPE_SECRET_KEY`     | Stripe secret key used to initialize the Stripe client and create checkout sessions. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret used to verify incoming `/webhook/stripe` events.      |

---

## 6. Core Domain Models

Based on `prisma/schema.prisma`:

| Entity               | Main Fields                                                                                                                  | Notes                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `User`               | `id`, `name`, `email` (unique), `password` (hashed), `token?`, timestamps                                                    | Holds account data and auth token for API access.                    |
| `UserAddress`        | `id`, `userId`, `zipcode`, `street`, `number`, `city`, `state`, `country`, `complement?`, timestamps                         | Delivery addresses associated to a user.                             |
| `Banner`             | `id`, `img`, `link`, timestamps                                                                                              | Marketing banners; images are served from `media/banners/...`.       |
| `Category`           | `id`, `slug` (unique), `name`, timestamps                                                                                    | Product categorization; linked to products and category metadata.    |
| `CategoryMetadata`   | `id` (string), `name`, `categoryId`, timestamps                                                                              | Describes metadata dimensions for a category (e.g., style).          |
| `MetadataValue`      | `id` (string), `label`, `categoryMetadataId`, timestamps                                                                     | Possible values for a given `CategoryMetadata`.                      |
| `Product`            | `id`, `label`, `price`, `description?`, `categoryId`, `viewsCount`, `salesCount`, timestamps                                 | Sellable items; linked to images, metadata, and order items.         |
| `ProductImage`       | `id`, `productId`, `url`, timestamps                                                                                         | Product images (relative paths under `media/products/...`).          |
| `ProductMetadata`    | `id`, `productId`, `categoryMetadataId`, `metadataValueId`, timestamps                                                       | Links products to metadata values.                                   |
| `Order`              | `id`, `userId`, `status` (default `"pending"`), `total`, `shippingCost`, `shippingDays`, shipping address fields, timestamps | Completed carts placed by a user; status updated via Stripe webhook. |
| `OrderProduct`       | `id`, `orderId`, `productId`, `quantity`, `price`, timestamps                                                                | Line items of an order (snapshot of product price and quantity).     |
| `Address` (TS type)  | `zipcode`, `street`, `number`, `city`, `state`, `country`, `complement?`                                                     | Used in order creation and address services.                         |
| `CartItem` (TS type) | `productId`, `quantity`                                                                                                      | Used in cart operations and Stripe checkout creation.                |

---

## 7. API Endpoints

### Authentication and headers

- **Authenticated endpoints** expect an HTTP header: `Authorization: Bearer <token>`.
- `token` is obtained from the `/user/login` endpoint and persisted in the `User.token` column.

### Health

| Method | Route   | Auth | Description                                     |
| ------ | ------- | ---- | ----------------------------------------------- |
| GET    | `/ping` | No   | Simple health check returning `{ pong: true }`. |

### Banners

| Method | Route      | Auth | Description                                         |
| ------ | ---------- | ---- | --------------------------------------------------- |
| GET    | `/banners` | No   | Returns marketing banners with absolute image URLs. |

### Products

| Method | Route                  | Auth | Description                                                                     |
| ------ | ---------------------- | ---- | ------------------------------------------------------------------------------- |
| GET    | `/products`            | No   | Lists products with optional filters and sorting.                               |
| GET    | `/product/:id`         | No   | Returns details of a single product and its category; increments product views. |
| GET    | `/product/:id/related` | No   | Returns products from the same category as the given product.                   |

**Notes:**

- `/products` supports query parameters validated via `getProductSchema`:
  - `metadata` (stringified object): filters by metadata key/value combinations.
  - `orderBy`: one of `"views"`, `"selling"`, `"price"` (defaults to `"views"`).
  - `limit`: numeric string limiting the number of results.

### Categories

| Method | Route                      | Auth | Description                                                              |
| ------ | -------------------------- | ---- | ------------------------------------------------------------------------ |
| GET    | `/category/:slug/metadata` | No   | Looks up a category by slug and returns basic category info and metadata |

### Cart and Checkout

| Method | Route            | Auth | Description                                                                    |
| ------ | ---------------- | ---- | ------------------------------------------------------------------------------ |
| POST   | `/cart/mount`    | No   | Builds a cart preview from an array of product IDs.                            |
| GET    | `/cart/shipping` | No   | Returns a fixed shipping quote for a given ZIP code.                           |
| POST   | `/cart/finish`   | Yes  | Creates an order for the authenticated user and returns a Stripe checkout URL. |

**Details:**

- **`POST /cart/mount`**:
  - Body validated by `cartMountSchema`:
    - `ids`: non-empty array of integer product IDs.
  - Returns a list of lightweight product objects for the cart (id, label, price, first image URL or `null`).

- **`GET /cart/shipping`**:
  - Query validated by `calculateShippingSchema`:
    - `zipcode` (string, non-empty).
  - Currently returns hard-coded values: `cost: 10`, `days: 3`.

- **`POST /cart/finish`** (authenticated):
  - Body validated by `finishSchema`:
    - `addressId`: integer ID of an existing user address.
    - `cart`: non-empty array of `{ productId: number, quantity: number >= 1 }`.
  - Steps:
    - Verifies the user via `authMiddleware`.
    - Verifies the address belongs to the user.
    - Calculates subtotal from current product prices, applies hard-coded shipping cost/days, and creates an `Order`.
    - Calls `createPaymentLink` to create a Stripe checkout session and returns its `url`.
  - Response: on success, `201` with `{ error: null, url }`.

### Users and Addresses

| Method | Route             | Auth | Description                                       |
| ------ | ----------------- | ---- | ------------------------------------------------- |
| POST   | `/user/register`  | No   | Registers a new user.                             |
| POST   | `/user/login`     | No   | Logs in a user and returns an auth token.         |
| POST   | `/user/addresses` | Yes  | Creates a new address for the authenticated user. |
| GET    | `/user/addresses` | Yes  | Lists addresses for the authenticated user.       |

**Details:**

- **`POST /user/register`**:
  - Body validated by `registerSchema`:
    - `name` (min length 2), `email` (valid email), `password` (min length 6).
  - If email is already in use, returns `400` with `{ error: "Email already in use" }`.
  - On success, returns `201` with `{ error: null, user }` (user without password/token).

- **`POST /user/login`**:
  - Body validated by `loginSchema`:
    - `email`, `password`.
  - On successful credentials:
    - Generates a UUID token, stores it in `User.token`, and returns `{ error: null, token }`.
  - On failure, returns `401` with `{ error: "Access denied" }`.

- **`POST /user/addresses`** (authenticated):
  - Body validated by `addAddressSchema` (zipcode, street, number, city, state, country, optional complement).
  - Returns `201` with `{ error: null, address }` on success.

- **`GET /user/addresses`** (authenticated):
  - Returns `{ error: null, addresses }` with address list.

### Orders

| Method | Route             | Auth | Description                                       |
| ------ | ----------------- | ---- | ------------------------------------------------- |
| GET    | `/orders/session` | No   | Resolves an order ID from a Stripe session ID.    |
| GET    | `/orders`         | Yes  | Lists orders of the authenticated user.           |
| GET    | `/orders/:id`     | Yes  | Returns order details for the authenticated user. |

**Details:**

- **`GET /orders/session`**:
  - Query validated by `getOrderBySessionIdSchema`:
    - `session_id` (string).
  - Uses Stripe API to retrieve the checkout session and reads `metadata.orderId`.
  - On success: `{ error: null, orderId }`. On failure: `400` with `{ error: "Something went wrong" }`.

- **`GET /orders`** (authenticated):
  - Uses `getUserOrders` to return a list sorted by `createdAt` desc.
  - Response: `{ error: null, orders }`.

- **`GET /orders/:id`** (authenticated):
  - Params validated by `getOrderSchema` (`id` numeric string).
  - Ensures the order belongs to the user. Otherwise `404` with `{ error: "Order not found" }`.
  - Returns `{ error: null, order }` with line items including a single `image` URL for each product.

### Stripe Webhook

| Method | Route             | Auth                              | Description                                               |
| ------ | ----------------- | --------------------------------- | --------------------------------------------------------- |
| POST   | `/webhook/stripe` | No (secured via Stripe signature) | Receives Stripe checkout events and updates order status. |

**Details:**

- Body is parsed as **raw** (`express.raw({ type: "application/json" })`) to allow Stripe signature verification.
- Uses `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET` and the `stripe-signature` header.
- Recognized event types:
  - `checkout.session.completed` and `checkout.session.async_payment_succeeded`: sets order status to `"paid"`.
  - `checkout.session.expired` and `checkout.session.async_payment_failed`: sets order status to `"cancelled"`.
- Always responds with `{ error: null }` (even if event is ignored or invalid).

### Example requests (main flows)

**Register a user**

```bash
curl -X POST http://localhost:4000/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "secret123"
  }'
```

**Login and obtain token**

```bash
curl -X POST http://localhost:4000/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "secret123"
  }'
```

**Complete checkout for an authenticated user**

```bash
curl -X POST http://localhost:4000/cart/finish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "addressId": 1,
    "cart": [
      { "productId": 1, "quantity": 2 },
      { "productId": 2, "quantity": 1 }
    ]
  }'
```

---

## 8. Response Patterns and Error Handling

- **General structure**:
  - Successful responses typically follow the pattern: `{ error: null, ...data }`.
  - Error responses use `{ error: "<message>" }`.
- **Error details**:
  - Validation errors from Zod are not exposed in detail. Only a generic message such as `"Invalid data"` or `"Invalid params"` is returned.

---

## 9. Limitations and Future Improvements

- **Error details**: Providing more specific error messages to the user can help them fix incorrect data.
- **Authentication model**: Uses a persistent UUID token without expiration or refresh mechanisms. adding token expiry, revocation, and logout endpoints would strengthen security.
- **Shipping logic**: Shipping cost and delivery days are hardcoded. Integrating real shipping calculations or configurable rules would make the flow more realistic.
- **Tests and QA**: No automated tests (unit, integration, or end-to-end) are present. Adding tests for auth, ordering, and payment flows would increase confidence in changes.
- **Security hardening**: There is no rate limiting, request logging beyond `console.error`, or explicit input sanitization beyond Zod. These could be considered for more demanding environments.
