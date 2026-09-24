import express from "express";

import {
    listProducts,
    getProduct,
    addProduct,
    editProduct,
    removeProduct
} from "../controllers/product.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import validate from "../middleware/validation.middleware.js";
import {
    validateCreateProduct,
    validateUpdateProduct,
    validateProductId,
    validateProductQuery
} from "../validators/product.validator.js";

const router = express.Router();

//public routes

router.get(
    "/",
    validate(validateProductQuery),
    listProducts
);

router.get(
    "/:id",
    validate(validateProductId),
    getProduct
);

// Admin Only
router.post(
    "/",
    authenticate,
    authorizeRoles("admin"),
    validate(validateCreateProduct),
    addProduct
);

router.patch(
    "/:id",
    authenticate,
    authorizeRoles("admin"),
    validate(validateProductId),
    validate(validateUpdateProduct),
    editProduct
);

router.delete(
    "/:id",
    authenticate,
    authorizeRoles("admin"),
    validate(validateProductId),
    removeProduct
);

export default router;