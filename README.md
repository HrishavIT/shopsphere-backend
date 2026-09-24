# ShopSphere Backend

A production-style e-commerce REST API built with **Node.js, Express.js,
and PostgreSQL**. ShopSphere is an interview-focused backend project
demonstrating authentication, role-based authorization, product
management, shopping carts, transactional checkout, order management,
validation, centralized error handling, and relational database design.

## Features

-   JWT authentication and bcrypt password hashing
-   Customer/admin role-based authorization
-   Current-user profile endpoint
-   Product CRUD with soft deletion
-   Pagination, category/price filtering, and sorting
-   Shopping cart management
-   Stock validation
-   Transactional checkout with PostgreSQL
-   Automatic stock deduction and cart clearing after checkout
-   Order history and order ownership protection
-   Admin order-status management
-   Reusable request-validation middleware
-   Centralized error handling with `AppError`
-   Parameterized SQL queries
-   PostgreSQL constraints, indexes, and connection pooling
-   Environment-based configuration
-   Configurable CORS and request-body limits

## Tech Stack

  Technology       Purpose
  ---------------- -----------------------------------
  Node.js          Runtime
  Express.js       REST API framework
  PostgreSQL       Relational database
  `pg`             PostgreSQL client/connection pool
  `bcrypt`         Password hashing
  `jsonwebtoken`   JWT authentication
  `dotenv`         Environment configuration
  `cors`           CORS handling
  Nodemon          Development server
  Postman          API testing

## Architecture

``` text
Client
  |
  v
Routes
  |
  v
Middleware
  |-- Authentication
  |-- Authorization
  |-- Validation
  |
  v
Controllers
  |
  v
Services
  |
  v
PostgreSQL
```

Routes define endpoints, middleware handles cross-cutting concerns,
controllers handle HTTP concerns, and services contain business/database
logic.

## Project Structure

``` text
ShopSphere/
├── database/
│   └── schema.sql
├── docs/
│   └── API.md
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   └── product.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── role.middleware.js
│   │   └── validation.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   └── product.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── cart.service.js
│   │   ├── order.service.js
│   │   └── product.service.js
│   ├── utils/
│   │   └── AppError.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── cart.validator.js
│   │   ├── order.validator.js
│   │   └── product.validator.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Database Design

The database contains six main tables:

``` text
users
  |
  +---- carts ---- cart_items ---- products
  |
  +---- orders ---- order_items ---- products
```

### Users

Stores `id`, `name`, `email`, `password_hash`, `role`, and timestamps.
Roles are `customer` and `admin`.

### Products

Stores `name`, `description`, `price`, `stock_quantity`, `category`,
`is_active`, and timestamps. Product deletion is implemented as a soft
delete using `is_active`.

### Carts / Cart Items

Each user has at most one cart. `cart_items` links products to carts and
enforces uniqueness for `(cart_id, product_id)`.

### Orders / Order Items

Orders contain the user, status, total amount, shipping address, and
timestamps. Order items store quantity and `unit_price`, preserving the
price at checkout even if the product price changes later.

The schema also uses foreign keys, check constraints, unique
constraints, and indexes. See
[`database/schema.sql`](database/schema.sql).

## Installation

### 1. Clone

``` bash
git clone https://github.com/HrishavIT/shopsphere-backend
cd ShopSphere
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Create PostgreSQL database

``` sql
CREATE DATABASE shopsphere;
```

### 4. Apply the schema

Run `database/schema.sql` against the `shopsphere` database.

### 5. Configure `.env`

Create `.env` in the project root:

``` env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopsphere
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1h

CLIENT_URL=http://localhost:3000
```

Never commit the real `.env`. `.env.example` documents the required
variables without containing real secrets.

### 6. Start development server

``` bash
npm run dev
```

Default API URL:

``` text
http://localhost:5000
```

## Authentication Flow

``` text
Register -> bcrypt password hash -> PostgreSQL
                         |
Login -> verify password -> JWT
                         |
Authorization: Bearer <token>
                         |
JWT verification -> load current user from PostgreSQL -> req.user
```

The middleware retrieves the current user from the database after
verifying the JWT, so authorization uses current database state rather
than blindly trusting stale role data in a token.

## Authorization

### Customer

Can browse products, manage their own cart, checkout, and view their own
orders/profile.

Cannot create/update/delete products or update order status, and cannot
access another customer's order.

### Admin

Can perform authenticated customer operations plus create/update/delete
products and update order status.

Admin routes use:

``` text
authenticate -> authorizeRoles("admin") -> controller
```

## Validation & Error Handling

Validation is implemented as reusable middleware before controllers.
Expected application errors use `AppError`, while controllers pass
unexpected errors to centralized error middleware.

Standard error shape:

``` json
{
  "success": false,
  "message": "Error message"
}
```

Unexpected server errors return a generic `Internal Server Error`
response rather than exposing implementation details.

## Security

-   bcrypt password hashing
-   JWT Bearer authentication
-   Explicit HS256 JWT verification
-   Current-user lookup from PostgreSQL
-   Role-based authorization
-   Parameterized SQL queries
-   Database constraints
-   PostgreSQL transactions
-   Connection pooling with limits/timeouts
-   `.env` excluded from Git
-   Configurable CORS
-   JSON/urlencoded request-body limits
-   Centralized error handling

## Transactional Checkout

Checkout is atomic:

``` text
BEGIN
  -> load cart
  -> load/lock products
  -> validate availability and stock
  -> calculate total
  -> create order
  -> create order items
  -> decrease stock
  -> clear cart
COMMIT
```

If any step fails, the transaction rolls back. Product rows can be
locked with PostgreSQL row-level locking (`FOR UPDATE`) to protect stock
updates during concurrent checkout attempts.

## API Overview

  Method   Endpoint                       Auth   Role
  -------- ------------------------------ ------ ------------------------
  POST     `/api/auth/register`           No     Public
  POST     `/api/auth/login`              No     Public
  GET      `/api/auth/me`                 Yes    Any authenticated user
  GET      `/api/products`                No     Public
  GET      `/api/products/:id`            No     Public
  POST     `/api/products`                Yes    Admin
  PATCH    `/api/products/:id`            Yes    Admin
  DELETE   `/api/products/:id`            Yes    Admin
  GET      `/api/cart`                    Yes    Authenticated user
  POST     `/api/cart/items`              Yes    Authenticated user
  PATCH    `/api/cart/items/:productId`   Yes    Authenticated user
  DELETE   `/api/cart/items/:productId`   Yes    Authenticated user
  DELETE   `/api/cart`                    Yes    Authenticated user
  POST     `/api/orders`                  Yes    Authenticated user
  GET      `/api/orders`                  Yes    Authenticated user
  GET      `/api/orders/:id`              Yes    Authenticated user
  PATCH    `/api/orders/:id/status`       Yes    Admin

## Detailed API Documentation

See **[`docs/API.md`](docs/API.md)** for every endpoint, headers,
request bodies, query parameters, validation rules, status codes, and
example workflows.

## HTTP Status Codes

  Code   Meaning
  ------ --------------------------------
  200    Successful request
  201    Resource created
  400    Invalid request
  401    Missing/invalid authentication
  403    Insufficient permissions
  404    Resource not found
  409    Resource conflict
  500    Unexpected server error

## Testing

The API was tested with Postman, including authentication, validation,
RBAC, product CRUD, pagination/filtering/sorting, cart operations,
checkout, stock handling, order ownership, and admin order-status
updates.

## Future Improvements

Potential future additions:

-   Refresh tokens
-   Rate limiting
-   Automated unit/integration tests
-   Swagger/OpenAPI
-   Redis caching
-   Payment gateway integration
-   Email notifications
-   Reviews and wishlists
-   Advanced search
-   Docker and CI/CD
-   Cloud deployment
-   Logging/observability
-   API versioning

## Author

**Hrishav Raj Singh**

Built as a backend engineering and interview-focused project.

## License

For educational and portfolio purposes.
