import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "100kb"
    })
);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ShopSphere API is running"
    });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`ShopSphere server running on port ${PORT}`);
});