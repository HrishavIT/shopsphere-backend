import AppError from "../utils/AppError.js";

export const validateRegister = (req) => {
    const {
        name,
        email,
        password
    } = req.body;

    if (
        name === undefined ||
        email === undefined ||
        password === undefined
    ) {
        throw new AppError(
            "Name, email and password are required",
            400
        );
    }

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        throw new AppError(
            "Name, email and password must be strings",
            400
        );
    }

    if (name.trim().length === 0) {
        throw new AppError(
            "Name must be a non-empty string",
            400
        );
    }

    if (password.length < 8) {
        throw new AppError(
            "Password must be at least 8 characters long",
            400
        );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        throw new AppError(
            "Please provide a valid email address",
            400
        );
    }
};


export const validateLogin = (req) => {
    const {
        email,
        password
    } = req.body;

    if (
        email === undefined ||
        password === undefined
    ) {
        throw new AppError(
            "Email and password are required",
            400
        );
    }

    if (
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        throw new AppError(
            "Email and password must be strings",
            400
        );
    }

    if (email.trim().length === 0) {
        throw new AppError(
            "Email must be a non-empty string",
            400
        );
    }

    if (password.length === 0) {
        throw new AppError(
            "Password must be a non-empty string",
            400
        );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        throw new AppError(
            "Please provide a valid email address",
            400
        );
    }
};