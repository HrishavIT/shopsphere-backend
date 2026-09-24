import AppError from "../utils/AppError.js";

export const validateCreateOrder = (req) => {
    const { shippingAddress } = req.body;

    if (shippingAddress === undefined) {
        throw new AppError(
            "Shipping address is required",
            400
        );
    }

    if (
        typeof shippingAddress !== "string" ||
        shippingAddress.trim().length === 0
    ) {
        throw new AppError(
            "Shipping address must be a non-empty string",
            400
        );
    }
};

export const validateOrderId = (req) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        throw new AppError(
            "Order ID must be a valid number",
            400
        );
    }
};

export const validateUpdateOrderStatus = (req) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!/^\d+$/.test(id)) {
        throw new AppError(
            "Order ID must be a valid number",
            400
        );
    }

    if (status === undefined) {
        throw new AppError(
            "Status is required",
            400
        );
    }

    if (typeof status !== "string") {
        throw new AppError(
            "Status must be a string",
            400
        );
    }

    const allowedStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new AppError(
            "Invalid order status",
            400
        );
    }
};