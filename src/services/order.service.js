import pool from "../config/db.js";
import AppError from "../utils/AppError.js";


export const createOrder = async ({
    userId,
    shippingAddress
}) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Find user's cart
        const cartResult = await client.query(
            `
            SELECT id
            FROM carts
            WHERE user_id = $1
            `,
            [userId]
        );

        if (cartResult.rows.length === 0) {
            throw new AppError(
                "Cart not found",
                404
            );
        }

        const cartId = cartResult.rows[0].id;

        // 2. Get cart items and lock products
        const cartItemsResult = await client.query(
            `
            SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.stock_quantity,
                p.is_active
            FROM cart_items ci
            JOIN products p
                ON ci.product_id = p.id
            WHERE ci.cart_id = $1
            FOR UPDATE OF ci, p
            `,
            [cartId]
        );

        if (cartItemsResult.rows.length === 0) {
            throw new AppError(
                "Cannot place an order with an empty cart",
                400
            );
        }

        const cartItems = cartItemsResult.rows;

        // 3. Validate products and stock
        for (const item of cartItems) {
            if (!item.is_active) {
                throw new AppError(
                    `Product "${item.name}" is no longer available`,
                    400
                );
            }

            if (item.quantity > item.stock_quantity) {
                throw new AppError(
                    `Only ${item.stock_quantity} units of "${item.name}" are available`,
                    400
                );
            }
        }

        // 4. Calculate order total
        const totalAmount = cartItems
            .reduce(
                (total, item) =>
                    total +
                    Number(item.price) *
                    Number(item.quantity),
                0
            )
            .toFixed(2);

        // 5. Create order
        const orderResult = await client.query(
            `
            INSERT INTO orders (
                user_id,
                status,
                total_amount,
                shipping_address
            )
            VALUES ($1, 'pending', $2, $3)
            RETURNING
                id,
                user_id,
                status,
                total_amount,
                shipping_address,
                created_at
            `,
            [
                userId,
                totalAmount,
                shippingAddress.trim()
            ]
        );

        const order = orderResult.rows[0];

        // 6. Create order items
        for (const item of cartItems) {
            await client.query(
                `
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    quantity,
                    unit_price
                )
                VALUES ($1, $2, $3, $4)
                `,
                [
                    order.id,
                    item.product_id,
                    item.quantity,
                    item.price
                ]
            );
        }

        // 7. Decrease product stock
        for (const item of cartItems) {
            await client.query(
                `
                UPDATE products
                SET
                    stock_quantity = stock_quantity - $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    item.quantity,
                    item.product_id
                ]
            );
        }

        // 8. Clear cart
        await client.query(
            `
            DELETE FROM cart_items
            WHERE cart_id = $1
            `,
            [cartId]
        );

        await client.query("COMMIT");

        return {
            ...order,
            items: cartItems.map((item) => ({
                productId: item.product_id,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: (
                    Number(item.price) *
                    Number(item.quantity)
                ).toFixed(2)
            }))
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};

export const getOrdersByUserId = async (userId) => {
    const result = await pool.query(
        `
        SELECT
            o.id,
            o.status,
            o.total_amount,
            o.shipping_address,
            o.created_at,
            COALESCE(
                json_agg(
                    json_build_object(
                        'productId', oi.product_id,
                        'quantity', oi.quantity,
                        'unitPrice', oi.unit_price
                    )
                    ORDER BY oi.id
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) AS items
        FROM orders o
        LEFT JOIN order_items oi
            ON o.id = oi.order_id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
        `,
        [userId]
    );

    return result.rows;
};

export const getOrderById = async ({
    orderId,
    userId
}) => {
    const result = await pool.query(
        `
        SELECT
            o.id,
            o.status,
            o.total_amount,
            o.shipping_address,
            o.created_at,
            o.updated_at,
            COALESCE(
                json_agg(
                    json_build_object(
                        'productId', oi.product_id,
                        'quantity', oi.quantity,
                        'unitPrice', oi.unit_price
                    )
                    ORDER BY oi.id
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) AS items
        FROM orders o
        LEFT JOIN order_items oi
            ON o.id = oi.order_id
        WHERE o.id = $1
          AND o.user_id = $2
        GROUP BY o.id
        `,
        [orderId, userId]
    );

    if (result.rows.length === 0) {
        throw new AppError(
            "Order not found",
            404
        );
    }

    return result.rows[0];
};

export const updateOrderStatus = async ({
    orderId,
    status
}) => {
    const result = await pool.query(
        `
        UPDATE orders
        SET
            status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
            id,
            user_id,
            status,
            total_amount,
            shipping_address,
            created_at,
            updated_at
        `,
        [
            status,
            orderId
        ]
    );

    if (result.rows.length === 0) {
        throw new AppError(
            "Order not found",
            404
        );
    }

    return result.rows[0];
};