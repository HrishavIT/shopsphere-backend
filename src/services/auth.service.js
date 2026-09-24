import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

const SALT_ROUNDS = 12;

export const registerUser = async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
        throw new AppError(
            "Email is already registered",
            409
        );
    }

    const passwordHash = await bcrypt.hash(
        password,
        SALT_ROUNDS
    );

    const result = await pool.query(
        `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, role, created_at
        `,
        [name.trim(), normalizedEmail, passwordHash]
    );

    return result.rows[0];
};


export const loginUser = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
        `
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = $1
        `,
        [normalizedEmail]
    );

    if (result.rows.length === 0) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatches) {
        throw new AppError(
            "Invalid email or password",
            401
        );
    }

    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    };
};