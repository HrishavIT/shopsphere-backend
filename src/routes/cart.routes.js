import express from "express";

import {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearUserCart
} from "../controllers/cart.controller.js";

import authenticate from "../middleware/auth.middleware.js";

import validate from "../middleware/validation.middleware.js";

import {
    validateAddToCart,
    validateUpdateCartItem,
    validateCartProductId
} from "../validators/cart.validator.js";

const router = express.Router();

router.get(
    "/",
    authenticate,
    getCart
);

router.post(
    "/items",
    authenticate,
    validate(validateAddToCart),
    addItem
);

router.patch(
    "/items/:productId",
    authenticate,
    validate(validateUpdateCartItem),
    updateItem
);

router.delete(
    "/",
    authenticate,
    clearUserCart
);

router.delete(
    "/items/:productId",
    authenticate,
    validate(validateCartProductId),
    removeItem
);

export default router;