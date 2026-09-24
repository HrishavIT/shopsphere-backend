import express from "express";

import {
    placeOrder,
    getMyOrders,
    getMyOrder,
    updateStatus
} from "../controllers/order.controller.js";

import authenticate from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";


import validate from "../middleware/validation.middleware.js";

import {
    validateCreateOrder,
    validateOrderId,
    validateUpdateOrderStatus
} from "../validators/order.validator.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    validate(validateCreateOrder),
    placeOrder
);

router.get(
    "/",
    authenticate,
    getMyOrders
);

router.get(
    "/:id",
    authenticate,
    validate(validateOrderId),
    getMyOrder
);

router.patch(
    "/:id/status",
    authenticate,
    authorizeRoles("admin"),
    validate(validateUpdateOrderStatus),
    updateStatus
);
export default router;