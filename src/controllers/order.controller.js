import {
    createOrder,
    getOrdersByUserId,
    getOrderById,
    updateOrderStatus
} from "../services/order.service.js";


export const placeOrder = async (req, res, next) => {
    try {
        const {
            shippingAddress
        } = req.body;

        const order = await createOrder({
            userId: req.user.id,
            shippingAddress: shippingAddress.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: {
                order
            }
        });

    } catch (error) {
        next(error);
    }
};

export const getMyOrders = async (req, res, next) => {
    try {
        const orders = await getOrdersByUserId(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: {
                orders
            }
        });

    } catch (error) {
        next(error);
    }
};

export const getMyOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await getOrderById({
            orderId: Number(id),
            userId: req.user.id
        });

        return res.status(200).json({
            success: true,
            data: {
                order
            }
        });

    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await updateOrderStatus({
            orderId: Number(id),
            status
        });

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: {
                order
            }
        });

    } catch (error) {
        next(error);
    }
};