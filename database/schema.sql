-- ShopSphere Database Schema
-- PostgreSQL
-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'customer',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (role IN ('customer', 'admin'))
);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    price NUMERIC(12, 2) NOT NULL,

    stock_quantity INTEGER NOT NULL DEFAULT 0,

    category VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT products_price_check
        CHECK (price >= 0),

    CONSTRAINT products_stock_check
        CHECK (stock_quantity >= 0)
);

-- ============================================================
-- CARTS
-- ============================================================

CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- CART ITEMS
-- ============================================================

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,

    cart_id BIGINT NOT NULL,

    product_id BIGINT NOT NULL,

    quantity INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT cart_items_quantity_check
        CHECK (quantity > 0),

    CONSTRAINT unique_cart_product
        UNIQUE (cart_id, product_id)
);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    total_amount NUMERIC(12, 2) NOT NULL,

    shipping_address TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT orders_status_check
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'processing',
                'shipped',
                'delivered',
                'cancelled'
            )
        ),

    CONSTRAINT orders_total_check
        CHECK (total_amount >= 0)
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL,

    product_id BIGINT NOT NULL,

    quantity INTEGER NOT NULL,

    unit_price NUMERIC(12, 2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT order_items_quantity_check
        CHECK (quantity > 0),

    CONSTRAINT order_items_price_check
        CHECK (unit_price >= 0),

    CONSTRAINT unique_order_product
        UNIQUE (order_id, product_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_category
    ON products(category);

CREATE INDEX idx_products_active
    ON products(is_active);

CREATE INDEX idx_orders_user_id
    ON orders(user_id);

CREATE INDEX idx_orders_status
    ON orders(status);

CREATE INDEX idx_order_items_order_id
    ON order_items(order_id);

CREATE INDEX idx_cart_items_cart_id
    ON cart_items(cart_id);
