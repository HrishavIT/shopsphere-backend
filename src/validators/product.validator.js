import AppError from "../utils/AppError.js";

export const validateCreateProduct = (req) => {
    const {
        name,
        description,
        price,
        stockQuantity,
        category
    } = req.body;

    if (
        name === undefined ||
        price === undefined ||
        stockQuantity === undefined
    ) {
        throw new AppError(
            "Name, price and stockQuantity are required",
            400
        );
    }

    if (
        typeof name !== "string" ||
        name.trim().length === 0
    ) {
        throw new AppError(
            "Name must be a non-empty string",
            400
        );
    }

    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {
        throw new AppError(
            "Description must be a string",
            400
        );
    }

    if (
        category !== undefined &&
        category !== null &&
        typeof category !== "string"
    ) {
        throw new AppError(
            "Category must be a string",
            400
        );
    }

    const numericPrice = Number(price);

    if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
    ) {
        throw new AppError(
            "Price must be a valid non-negative number",
            400
        );
    }

    const numericStock = Number(stockQuantity);

    if (
        !Number.isInteger(numericStock) ||
        numericStock < 0
    ) {
        throw new AppError(
            "stockQuantity must be a non-negative integer",
            400
        );
    }
};

export const validateUpdateProduct = (req) => {
    const {
        name,
        description,
        price,
        stockQuantity,
        category
    } = req.body;

    if (
        name === undefined &&
        description === undefined &&
        price === undefined &&
        stockQuantity === undefined &&
        category === undefined
    ) {
        throw new AppError(
            "At least one field is required to update the product",
            400
        );
    }

    if (
        name !== undefined &&
        (typeof name !== "string" || name.trim().length === 0)
    ) {
        throw new AppError(
            "Name must be a non-empty string",
            400
        );
    }

    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {
        throw new AppError(
            "Description must be a string",
            400
        );
    }

    if (
        category !== undefined &&
        category !== null &&
        typeof category !== "string"
    ) {
        throw new AppError(
            "Category must be a string",
            400
        );
    }

    if (price !== undefined) {
        const numericPrice = Number(price);

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            throw new AppError(
                "Price must be a valid non-negative number",
                400
            );
        }
    }

    if (stockQuantity !== undefined) {
        const numericStock = Number(stockQuantity);

        if (
            !Number.isInteger(numericStock) ||
            numericStock < 0
        ) {
            throw new AppError(
                "stockQuantity must be a non-negative integer",
                400
            );
        }
    }
};

export const validateProductId = (req) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        throw new AppError(
            "Product ID must be a valid number",
            400
        );
    }
};

export const validateProductQuery = (req) => {
    const {
        page: pageQuery,
        limit: limitQuery,
        minPrice,
        maxPrice
    } = req.query;

    const page =
        pageQuery !== undefined
            ? Number(pageQuery)
            : 1;

    const limit =
        limitQuery !== undefined
            ? Number(limitQuery)
            : 10;

    if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        throw new AppError(
            "Page must be a positive integer and limit must be an integer between 1 and 100",
            400
        );
    }

    if (
        minPrice !== undefined &&
        (
            !Number.isFinite(Number(minPrice)) ||
            Number(minPrice) < 0
        )
    ) {
        throw new AppError(
            "minPrice must be a valid non-negative number",
            400
        );
    }

    if (
        maxPrice !== undefined &&
        (
            !Number.isFinite(Number(maxPrice)) ||
            Number(maxPrice) < 0
        )
    ) {
        throw new AppError(
            "maxPrice must be a valid non-negative number",
            400
        );
    }

    if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        Number(minPrice) > Number(maxPrice)
    ) {
        throw new AppError(
            "minPrice cannot be greater than maxPrice",
            400
        );
    }
};