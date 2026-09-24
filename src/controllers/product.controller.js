import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../services/product.service.js";
import AppError from "../utils/AppError.js";

export const listProducts = async (req, res, next) => {
    try {
        const page =
            req.query.page !== undefined
                ? Number(req.query.page)
                : 1;

        const limit =
            req.query.limit !== undefined
                ? Number(req.query.limit)
                : 10;

        const {
            category,
            minPrice,
            maxPrice,
            sort
        } = req.query;

        const result = await getProducts({
            page,
            limit,
            category,
            minPrice,
            maxPrice,
            sort
        });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};

export const getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await getProductById(id);

        return res.status(200).json({
            success: true,
            data: {
                product
            }
        });

    } catch (error) {
        next(error);
    }
};

export const addProduct = async (req, res, next) => {
    try {
        const {
            name,
            description,
            price,
            stockQuantity,
            category
        } = req.body;

        const product = await createProduct({
            name: name.trim(),
            description,
            price: Number(price),
            stockQuantity: Number(stockQuantity),
            category
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: {
                product
            }
        });

    } catch (error) {
        next(error);
    }
};

export const editProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            price,
            stockQuantity,
            category
        } = req.body;

        const product = await updateProduct(id, {
            name:
                name !== undefined
                    ? name.trim()
                    : undefined,

            description,

            price:
                price !== undefined
                    ? Number(price)
                    : undefined,

            stockQuantity:
                stockQuantity !== undefined
                    ? Number(stockQuantity)
                    : undefined,

            category
        });

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: {
                product
            }
        });

    } catch (error) {
        next(error);
    }
};

export const removeProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await deleteProduct(id);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: {
                product
            }
        });

    } catch (error) {
        next(error);
    }
};