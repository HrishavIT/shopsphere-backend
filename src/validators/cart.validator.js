import AppError from "../utils/AppError.js";

export const validateAddToCart = (req) => {
    const {
        productId,
        quantity
    } = req.body;

    if (
        productId === undefined ||
        quantity === undefined
    ) {
        throw new AppError(
            "productId and quantity are required",
            400
        );
    }

    const numericProductId = Number(productId);
    const numericQuantity = Number(quantity);

    if (
        !Number.isInteger(numericProductId) ||
        numericProductId < 1
    ) {
        throw new AppError(
            "productId must be a positive integer",
            400
        );
    }

    if (
        !Number.isInteger(numericQuantity) ||
        numericQuantity < 1
    ) {
        throw new AppError(
            "quantity must be a positive integer",
            400
        );
    }
};

export const validateUpdateCartItem = (req) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!/^\d+$/.test(productId)) {
        throw new AppError(
            "Product ID must be a valid number",
            400
        );
    }

    if (quantity === undefined) {
        throw new AppError(
            "Quantity is required",
            400
        );
    }

    const numericQuantity = Number(quantity);

    if (
        !Number.isInteger(numericQuantity) ||
        numericQuantity < 1
    ) {
        throw new AppError(
            "Quantity must be a positive integer",
            400
        );
    }
};

export const validateCartProductId = (req) => {
    const { productId } = req.params;

    if (!/^\d+$/.test(productId)) {
        throw new AppError(
            "Product ID must be a valid number",
            400
        );
    }
};