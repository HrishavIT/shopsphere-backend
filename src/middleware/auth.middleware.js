
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access token is required"
            });
        }

        const parts = authHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer" ||
            !parts[1]
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }

        const token = parts[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        const userId = Number(decoded.userId);

        if (
            !Number.isSafeInteger(userId) ||
            userId < 1
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        const result = await pool.query(
            `
            SELECT id, name, email, role
            FROM users
            WHERE id = $1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            });
        }

        req.user = result.rows[0];

        next();

    } catch (error) {
        if (
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        next(error);
    }
};

export default authenticate;