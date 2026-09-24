import pool from "../config/db.js";
import AppError from "../utils/AppError.js";


export const getCartByUserId = async (userId) => {
    const result = await pool.query(
        `
        SELECT
            c.id AS cart_id,
            ci.product_id,
            ci.quantity,
            p.name,
            p.description,
            p.price,
            p.stock_quantity,
            p.category,
            p.is_active
        FROM carts c
        LEFT JOIN cart_items ci
            ON c.id = ci.cart_id
        LEFT JOIN products p
            ON ci.product_id = p.id
        WHERE c.user_id = $1
        ORDER BY ci.product_id
        `,
        [userId]
    );

    if (result.rows.length === 0) {
        const cartResult = await pool.query(
            `
            INSERT INTO carts (user_id)
            VALUES ($1)
            ON CONFLICT (user_id)
            DO NOTHING
            RETURNING id
            `,
            [userId]
        );

        if (cartResult.rows.length > 0) {
            return {
                cartId: cartResult.rows[0].id,
                items: []
            };
        }

        const existingCart = await pool.query(
            `
            SELECT id
            FROM carts
            WHERE user_id = $1
            `,
            [userId]
        );

        return {
            cartId: existingCart.rows[0].id,
            items: []
        };
    }

    const cartId = result.rows[0].cart_id;

    const items = result.rows
        .filter((row) => row.product_id !== null)
        .map((row) => ({
            productId: row.product_id,
            name: row.name,
            description: row.description,
            price: row.price,
            stockQuantity: row.stock_quantity,
            category: row.category,
            isActive: row.is_active,
            quantity: row.quantity,
            subtotal:
                Number(row.price) * Number(row.quantity)
        }));

    return {
        cartId,
        items
    };
};

export const addItemToCart = async ({
    userId,
    productId,
    quantity
}) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Check product and lock its row
        const productResult = await client.query(
            `
            SELECT
                id,
                name,
                description,
                price,
                stock_quantity,
                category,
                is_active
            FROM products
            WHERE id = $1
            FOR UPDATE
            `,
            [productId]
        );

        if (productResult.rows.length === 0) {
            throw new AppError(
                "Product not found",
                404
            );
        }

        const product = productResult.rows[0];

        // 2. Check whether product is active
        if (!product.is_active) {
            throw new AppError(
                "Product is no longer available",
                400
            );
        }

        // 3. Find or create user's cart
        let cartResult = await client.query(
            `
            SELECT id
            FROM carts
            WHERE user_id = $1
            `,
            [userId]
        );

        let cartId;

        if (cartResult.rows.length === 0) {
            const newCartResult = await client.query(
                `
                INSERT INTO carts (user_id)
                VALUES ($1)
                RETURNING id
                `,
                [userId]
            );

            cartId = newCartResult.rows[0].id;
        } else {
            cartId = cartResult.rows[0].id;
        }

        // 4. Check whether product is already in cart
        const existingItemResult = await client.query(
            `
            SELECT quantity
            FROM cart_items
            WHERE cart_id = $1
              AND product_id = $2
            `,
            [cartId, productId]
        );

        const existingQuantity =
            existingItemResult.rows.length > 0
                ? existingItemResult.rows[0].quantity
                : 0;

        const finalQuantity =
            Number(existingQuantity) + Number(quantity);

        // 5. Check total requested quantity against stock
        if (finalQuantity > product.stock_quantity) {
            throw new AppError(
                `Only ${product.stock_quantity} units are available`,
                400
            );
        }

        if (existingItemResult.rows.length === 0) {
            await client.query(
                `
                INSERT INTO cart_items (
                    cart_id,
                    product_id,
                    quantity
                )
                VALUES ($1, $2, $3)
                `,
                [
                    cartId,
                    productId,
                    quantity
                ]
            );
        } else {
            await client.query(
                `
                UPDATE cart_items
                SET quantity = $1
                WHERE cart_id = $2
                  AND product_id = $3
                `,
                [
                    finalQuantity,
                    cartId,
                    productId
                ]
            );
        }

        await client.query("COMMIT");

        return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: finalQuantity,
            subtotal:
                Number(product.price) * finalQuantity
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};

export const updateCartItem = async ({
    userId,
    productId,
    quantity
}) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const productResult = await client.query(
            `
            SELECT
                id,
                name,
                price,
                stock_quantity,
                is_active
            FROM products
            WHERE id = $1
            FOR UPDATE
            `,
            [productId]
        );

        if (productResult.rows.length === 0) {
            throw new AppError(
                "Product not found",
                404
            );
        }

        const product = productResult.rows[0];

        if (!product.is_active) {
            throw new AppError(
                "Product is no longer available",
                400
            );
        }

        if (quantity > product.stock_quantity) {
            throw new AppError(
                `Only ${product.stock_quantity} units are available`,
                400
            );
        }

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

        const itemResult = await client.query(
            `
            UPDATE cart_items
            SET quantity = $1
            WHERE cart_id = $2
              AND product_id = $3
            RETURNING quantity
            `,
            [
                quantity,
                cartId,
                productId
            ]
        );

        if (itemResult.rows.length === 0) {
            throw new AppError(
                "Product is not in your cart",
                404
            );
        }

        await client.query("COMMIT");

        return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: itemResult.rows[0].quantity,
            subtotal:
                Number(product.price) * Number(quantity)
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};

export const removeCartItem = async ({
    userId,
    productId
}) => {
    const cartResult = await pool.query(
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

    const result = await pool.query(
        `
        DELETE FROM cart_items
        WHERE cart_id = $1
          AND product_id = $2
        RETURNING product_id, quantity
        `,
        [cartId, productId]
    );

    if (result.rows.length === 0) {
        throw new AppError(
            "Product is not in your cart",
            404
        );
    }

    return result.rows[0];
};

export const clearCart = async (userId) => {
    const cartResult = await pool.query(
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

    const result = await pool.query(
        `
        DELETE FROM cart_items
        WHERE cart_id = $1
        RETURNING product_id
        `,
        [cartId]
    );

    return {
        removedItems: result.rowCount
    };
};