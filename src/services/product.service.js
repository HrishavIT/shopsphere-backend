import pool from "../config/db.js";

export const getProducts = async ({
    page = 1,
    limit = 10,
    category,
    minPrice,
    maxPrice,
    sort
}) => {
    const offset = (page - 1) * limit;

    const conditions = ["is_active = TRUE"];
    const values = [];

    let parameterIndex = 1;

    if (category) {
        conditions.push(`category = $${parameterIndex}`);
        values.push(category);
        parameterIndex++;
    }

    if (minPrice !== undefined) {
        conditions.push(`price >= $${parameterIndex}`);
        values.push(minPrice);
        parameterIndex++;
    }

    if (maxPrice !== undefined) {
        conditions.push(`price <= $${parameterIndex}`);
        values.push(maxPrice);
        parameterIndex++;
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const sortOptions = {
        price_asc: "price ASC",
        price_desc: "price DESC",
        newest: "created_at DESC",
        oldest: "created_at ASC",
        name_asc: "name ASC",
        name_desc: "name DESC"
    };

    const orderBy = sortOptions[sort] || "created_at DESC";

    const productsQuery = `
        SELECT
            id,
            name,
            description,
            price,
            stock_quantity,
            category,
            is_active,
            created_at,
            updated_at
        FROM products
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${parameterIndex}
        OFFSET $${parameterIndex + 1}
    `;

    values.push(limit);
    values.push(offset);

    const productsResult = await pool.query(
        productsQuery,
        values
    );

    // Get total count
    const countValues = values.slice(0, -2);

    const countResult = await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM products
        ${whereClause}
        `,
        countValues
    );

    const total = Number(countResult.rows[0].total);

    return {
        products: productsResult.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getProductById = async (id) => {
    const result = await pool.query(
        `
        SELECT
            id,
            name,
            description,
            price,
            stock_quantity,
            category,
            is_active,
            created_at,
            updated_at
        FROM products
        WHERE id = $1
        AND is_active = TRUE
        `,
        [id]
    );

    if (result.rows.length === 0) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
};


export const createProduct = async ({
    name,
    description,
    price,
    stockQuantity,
    category
}) => {
    const result = await pool.query(
        `
        INSERT INTO products (
            name,
            description,
            price,
            stock_quantity,
            category
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            id,
            name,
            description,
            price,
            stock_quantity,
            category,
            is_active,
            created_at,
            updated_at
        `,
        [
            name.trim(),
            description?.trim() || null,
            price,
            stockQuantity,
            category?.trim() || null
        ]
    );

    return result.rows[0];
};


export const updateProduct = async (id, fields) => {
    const allowedFields = {
        name: "name",
        description: "description",
        price: "price",
        stockQuantity: "stock_quantity",
        category: "category"
    };

    const updates = [];
    const values = [];

    let parameterIndex = 1;

    for (const [field, value] of Object.entries(fields)) {
        if (value !== undefined && allowedFields[field]) {
            updates.push(
                `${allowedFields[field]} = $${parameterIndex}`
            );

            values.push(
                typeof value === "string"
                    ? value.trim()
                    : value
            );

            parameterIndex++;
        }
    }

    if (updates.length === 0) {
        const error = new Error("No valid fields provided for update");
        error.statusCode = 400;
        throw error;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);

    const result = await pool.query(
        `
        UPDATE products
        SET ${updates.join(", ")}
        WHERE id = $${parameterIndex}
        AND is_active = TRUE
        RETURNING
            id,
            name,
            description,
            price,
            stock_quantity,
            category,
            is_active,
            created_at,
            updated_at
        `,
        values
    );

    if (result.rows.length === 0) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
};


export const deleteProduct = async (id) => {
    const result = await pool.query(
        `
        UPDATE products
        SET
            is_active = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        AND is_active = TRUE
        RETURNING id, name, is_active
        `,
        [id]
    );

    if (result.rows.length === 0) {
        const error = new Error("Product not found");
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
};