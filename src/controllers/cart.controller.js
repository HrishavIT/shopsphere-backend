import {
    getCartByUserId,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} from "../services/cart.service.js";

export const getCart = async (req, res, next) => {
    try {
        const cart = await getCartByUserId(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: {
                cart
            }
        });

    } catch (error) {
        next(error);
    }
};

export const addItem = async (req, res, next) => {
    try {
        const {
            productId,
            quantity
        } = req.body;

        const item = await addItemToCart({
            userId: req.user.id,
            productId: Number(productId),
            quantity: Number(quantity)
        });

        return res.status(201).json({
            success: true,
            message: "Product added to cart successfully",
            data: {
                item
            }
        });

    } catch (error) {
        next(error);
    }
};

export const updateItem = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        const item = await updateCartItem({
            userId: req.user.id,
            productId: Number(productId),
            quantity: Number(quantity)
        });

        return res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            data: {
                item
            }
        });

    } catch (error) {
        next(error);
    }
};

export const removeItem = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const item = await removeCartItem({
            userId: req.user.id,
            productId: Number(productId)
        });

        return res.status(200).json({
            success: true,
            message: "Product removed from cart",
            data: {
                item
            }
        });

    } catch (error) {
        next(error);
    }
};

export const clearUserCart = async (req, res, next) => {
    try {
        const result = await clearCart(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
};