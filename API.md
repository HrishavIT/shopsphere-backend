# ShopSphere API Documentation

Complete REST API reference for ShopSphere.

**Base URL:** `http://localhost:5000`

## Authentication

Protected endpoints require:

``` http
Authorization: Bearer YOUR_JWT_TOKEN
```

In Postman, use **Authorization -\> Bearer Token**.

------------------------------------------------------------------------

# 1. Authentication APIs

## POST `/api/auth/register`

Creates a new customer account.

**Body:**

``` json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Required: `name`, `email`, `password`.

Validation includes non-empty string fields, valid email format, and
minimum 8-character password.

**Success:** `201 Created`

**Possible errors:** `400 Bad Request`, `409 Conflict`.

Duplicate email:

``` json
{
  "success": false,
  "message": "Email is already registered"
}
```

------------------------------------------------------------------------

## POST `/api/auth/login`

Authenticates a user and returns a JWT.

**Body:**

``` json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success:** `200 OK`

Example:

``` json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "YOUR_JWT_TOKEN"
  }
}
```

**Errors:** `400`, `401`.

Invalid credentials use the generic message `Invalid email or password`.

------------------------------------------------------------------------

## GET `/api/auth/me`

Returns the current authenticated user.

**Header:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success:** `200 OK`

``` json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": {
    "user": {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

**Errors:** `401 Unauthorized` for missing, malformed, invalid, expired,
or unusable tokens.

------------------------------------------------------------------------

# 2. Product APIs

Product listing/retrieval are public. Product creation/update/deletion
require an admin token.

## GET `/api/products`

Returns active products.

### Query parameters

  Parameter    Description                   Example
  ------------ ----------------------------- ---------------
  `page`       Page number, minimum 1        `1`
  `limit`      Results per page, 1-100       `10`
  `category`   Category filter               `Electronics`
  `minPrice`   Minimum price, non-negative   `500`
  `maxPrice`   Maximum price, non-negative   `5000`
  `sort`       Sorting option                `price_asc`

Examples:

``` http
GET /api/products
GET /api/products?page=1&limit=10
GET /api/products?category=Electronics
GET /api/products?minPrice=500&maxPrice=5000
GET /api/products?sort=price_asc
GET /api/products?page=1&limit=10&category=Electronics&minPrice=500&maxPrice=5000&sort=price_asc
```

Supported sort values:

``` text
price_asc
price_desc
newest
oldest
name_asc
name_desc
```

**Success:** `200 OK`.

**Validation errors:** `400 Bad Request`.

Examples include `page=0`, `limit=101`, negative prices, or
`minPrice > maxPrice`.

------------------------------------------------------------------------

## GET `/api/products/:id`

Returns one active product.

Example:

``` http
GET /api/products/5
```

**Success:** `200 OK`.

**Errors:** `400 Bad Request`, `404 Not Found`.

Example invalid ID:

``` http
GET /api/products/abc
```

------------------------------------------------------------------------

## POST `/api/products`

Creates a product. **Admin only.**

**Headers:**

``` http
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Body:**

``` json
{
  "name": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard",
  "price": 2500,
  "stockQuantity": 20,
  "category": "Electronics"
}
```

Required: `name`, `price`, `stockQuantity`.

Optional: `description`, `category`.

Validation:

-   `name` must be a non-empty string
-   `description`, when provided, must be a string
-   `category`, when provided, must be a string
-   `price` must be a finite non-negative number
-   `stockQuantity` must be a non-negative integer

**Success:** `201 Created`.

**Errors:** `400`, `401`, `403`.

------------------------------------------------------------------------

## PATCH `/api/products/:id`

Updates an existing product. **Admin only.**

**Headers:**

``` http
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json
```

Example:

``` http
PATCH /api/products/5
```

**Body:** at least one supported field is required.

``` json
{
  "price": 2200,
  "stockQuantity": 25
}
```

Supported fields: `name`, `description`, `price`, `stockQuantity`,
`category`.

**Success:** `200 OK`.

**Errors:** `400`, `401`, `403`, `404`.

------------------------------------------------------------------------

## DELETE `/api/products/:id`

Soft-deletes a product. **Admin only.**

**Header:**

``` http
Authorization: Bearer ADMIN_JWT_TOKEN
```

Example:

``` http
DELETE /api/products/5
```

The product is marked inactive rather than physically removed,
preserving historical references.

**Success:** `200 OK`.

**Errors:** `400`, `401`, `403`, `404`.

------------------------------------------------------------------------

# 3. Cart APIs

Cart endpoints require authentication and operate on the authenticated
user's cart.

## GET `/api/cart`

Returns the current user's cart.

**Header:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success:** `200 OK`.

------------------------------------------------------------------------

## POST `/api/cart/items`

Adds a product to the current user's cart.

**Headers:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**

``` json
{
  "productId": 5,
  "quantity": 2
}
```

Validation includes a valid product ID, positive integer quantity,
product existence/availability, and sufficient stock.

**Success:** `200 OK` (use the status returned by the current controller
if implementation-specific).

**Errors:** `400`, `401`, `404`.

------------------------------------------------------------------------

## PATCH `/api/cart/items/:productId`

Updates an existing cart item's quantity.

Example:

``` http
PATCH /api/cart/items/5
```

**Headers:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**

``` json
{
  "quantity": 4
}
```

**Errors:** `400`, `401`, `404`.

------------------------------------------------------------------------

## DELETE `/api/cart/items/:productId`

Removes one product from the current user's cart.

Example:

``` http
DELETE /api/cart/items/5
```

**Header:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success:** `200 OK`.

**Errors:** `400`, `401`, `404`.

------------------------------------------------------------------------

## DELETE `/api/cart`

Clears the authenticated user's cart.

**Header:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success:** `200 OK`.

Example response:

``` json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

------------------------------------------------------------------------

# 4. Order APIs

Orders are created through checkout. Customers can access their own
orders; admins can update order status.

## POST `/api/orders`

Creates an order from the authenticated user's cart.

**Headers:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**

``` json
{
  "shippingAddress": "123 Main Street, Bhubaneswar, Odisha, 751024"
}
```

Validation:

-   shipping address required
-   cart cannot be empty
-   products must still exist and be active
-   sufficient stock must be available

### Transaction flow

``` text
BEGIN
  -> get cart
  -> get cart items
  -> lock relevant products
  -> validate availability
  -> validate stock
  -> calculate total
  -> create order
  -> create order items
  -> decrease stock
  -> clear cart
COMMIT
```

If any step fails, the transaction rolls back.

**Success:** `201 Created`.

**Errors:** `400`, `401`, `404` depending on the failure.

------------------------------------------------------------------------

## GET `/api/orders`

Returns orders belonging to the authenticated user.

**Header:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success:** `200 OK`.

The API does not accept an arbitrary user ID for this operation; the
authenticated user's identity determines the result set.

------------------------------------------------------------------------

## GET `/api/orders/:id`

Returns one order belonging to the authenticated user.

Example:

``` http
GET /api/orders/1
```

**Header:**

``` http
Authorization: Bearer YOUR_JWT_TOKEN
```

Ownership is enforced using both order ID and authenticated user ID.

**Success:** `200 OK`.

**Errors:** `400`, `401`, `404`.

------------------------------------------------------------------------

## PATCH `/api/orders/:id/status`

Updates order status. **Admin only.**

Example:

``` http
PATCH /api/orders/1/status
```

**Headers:**

``` http
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Body:**

``` json
{
  "status": "confirmed"
}
```

Supported statuses:

``` text
pending
confirmed
processing
shipped
delivered
cancelled
```

**Success:** `200 OK`.

**Errors:** `400`, `401`, `403`, `404`.

------------------------------------------------------------------------

# 5. Authorization Matrix

  Operation               Public   Customer   Admin
  --------------------- -------- ---------- -------
  Register                   Yes        Yes     Yes
  Login                      Yes        Yes     Yes
  Get own profile             No        Yes     Yes
  List products              Yes        Yes     Yes
  Get product                Yes        Yes     Yes
  Create product              No         No     Yes
  Update product              No         No     Yes
  Delete product              No         No     Yes
  Get own cart                No        Yes     Yes
  Modify own cart             No        Yes     Yes
  Checkout                    No        Yes     Yes
  Get own orders              No        Yes     Yes
  Get own order               No        Yes     Yes
  Update order status         No         No     Yes

Customers cannot access another user's order.

------------------------------------------------------------------------

# 6. Validation Rules

## Authentication

-   Required fields are checked before service execution.
-   Email format is validated.
-   Password length is validated.

## Products

-   IDs must be numeric.
-   Product names must be non-empty strings.
-   Prices must be finite and non-negative.
-   Stock quantities must be non-negative integers.
-   Pagination starts at page 1.
-   Limit must be between 1 and 100.
-   `minPrice` cannot be greater than `maxPrice`.

## Cart

-   Product IDs must be valid.
-   Quantities must be positive integers.
-   Products must be available.
-   Requested quantities cannot exceed available stock.

## Orders

-   Shipping address is required for checkout.
-   Checkout requires a non-empty cart.
-   Products must remain active/available.
-   Stock is revalidated during checkout.
-   Order status must be one of the supported PostgreSQL values.

------------------------------------------------------------------------

# 7. Error Format

Expected errors use:

``` json
{
  "success": false,
  "message": "Error message"
}
```

Typical examples:

### 401

``` json
{
  "success": false,
  "message": "Access token is required"
}
```

### 403

``` json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404

``` json
{
  "success": false,
  "message": "Product not found"
}
```

### 500

``` json
{
  "success": false,
  "message": "Internal Server Error"
}
```

Unexpected implementation/database details are not returned to API
clients.

------------------------------------------------------------------------

# 8. HTTP Status Codes

  Code    Meaning
  ------- --------------------------------------------
  `200`   Successful request
  `201`   Resource created
  `400`   Invalid request / validation failure
  `401`   Missing or invalid authentication
  `403`   Authenticated but insufficient permissions
  `404`   Resource not found
  `409`   Resource conflict
  `500`   Unexpected server error

------------------------------------------------------------------------

# 9. Postman Test Checklist

## Authentication

-   [ ] Register valid user
-   [ ] Missing registration field
-   [ ] Invalid email
-   [ ] Short password
-   [ ] Duplicate email
-   [ ] Successful login
-   [ ] Incorrect password
-   [ ] Valid `/api/auth/me`
-   [ ] Missing token
-   [ ] Malformed token
-   [ ] Invalid/expired token

## Products

-   [ ] List products
-   [ ] Pagination
-   [ ] Invalid page
-   [ ] Invalid limit
-   [ ] Category filter
-   [ ] Price filter
-   [ ] Invalid price range
-   [ ] Sorting
-   [ ] Get product
-   [ ] Invalid product ID
-   [ ] Missing product
-   [ ] Admin creates product
-   [ ] Customer denied product creation
-   [ ] Admin updates product
-   [ ] Admin deletes product
-   [ ] Deleted product is no longer active

## Cart

-   [ ] Get cart
-   [ ] Add product
-   [ ] Invalid product
-   [ ] Invalid quantity
-   [ ] Quantity above stock
-   [ ] Update quantity
-   [ ] Remove item
-   [ ] Clear cart
-   [ ] Unauthenticated request denied

## Orders

-   [ ] Successful checkout
-   [ ] Empty cart checkout denied
-   [ ] Missing shipping address
-   [ ] Insufficient stock
-   [ ] Verify stock deduction
-   [ ] Verify cart clearing
-   [ ] Verify order creation
-   [ ] Verify order items
-   [ ] Get order history
-   [ ] Get own order
-   [ ] Attempt another user's order
-   [ ] Admin status update
-   [ ] Customer denied status update
-   [ ] Invalid order status

------------------------------------------------------------------------

# 10. Typical Workflows

## Customer

``` text
POST /api/auth/register
        |
        v
POST /api/auth/login
        |
        v
Receive JWT
        |
        v
GET /api/products
        |
        v
POST /api/cart/items
        |
        v
PATCH /api/cart/items/:productId
        |
        v
POST /api/orders
        |
        v
GET /api/orders
        |
        v
GET /api/orders/:id
```

## Admin

``` text
POST /api/auth/login
        |
        v
Receive admin JWT
        |
        +--> POST /api/products
        |
        +--> PATCH /api/products/:id
        |
        +--> DELETE /api/products/:id
        |
        +--> PATCH /api/orders/:id/status
```

------------------------------------------------------------------------

## Database Notes

The API is backed by these tables:

``` text
users
products
carts
cart_items
orders
order_items
```

Important constraints include:

-   `users.email` unique
-   `carts.user_id` unique
-   `(cart_id, product_id)` unique
-   `(order_id, product_id)` unique
-   product price non-negative
-   product stock non-negative
-   cart/order quantities positive
-   valid order-status check constraint

Product deletion is soft deletion (`is_active = false`) so order history
remains referentially valid.

------------------------------------------------------------------------

## Security Notes

-   Passwords are hashed with bcrypt.
-   JWTs are verified using the configured secret and HS256.
-   Current user/role is loaded from PostgreSQL after token
    verification.
-   Admin routes require both authentication and role authorization.
-   SQL values are passed through parameterized queries.
-   Checkout uses a PostgreSQL transaction and row locking where
    required for stock consistency.
-   `.env` must never be committed.
