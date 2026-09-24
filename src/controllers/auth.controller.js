import {
    registerUser,
    loginUser
} from "../services/auth.service.js";


export const register = async (req, res, next) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        const user = await registerUser({
            name: name.trim(),
            email: email.trim(),
            password
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user
            }
        });

    } catch (error) {
        next(error);
    }
};


export const login = async (req, res, next) => {
    try {
        const {
            email,
            password
        } = req.body;

        const result = await loginUser({
            email: email.trim(),
            password
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });

    } catch (error) {
        next(error);
    }
};


export const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: {
            user: req.user
        }
    });
};