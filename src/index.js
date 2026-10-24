
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

import categoryRouter from "./routers/categoryRouter.js";
import roomRouter from "./routers/roomRouter.js";
import productRouter from "./routers/productRouter.js";
import storePageHeroSectionRouter from "./routers/storepageherosectionRouter.js";
import homepageherosectionRouter from "./routers/homepageherosectionRouter.js";
import authRouter from "./routers/authRouter.js";
import profileRouter from "./routers/profileRouter.js";
import addressRouter from "./routers/addressRouter.js";
import orderRouter from "./routers/orderRouter.js";

const server = express();

// ==========================================
// MIDDLEWARE
// ==========================================

server.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

server.use(express.json());
server.use(cookieParser());

// ==========================================
// API ROUTES
// ==========================================

server.use("/api/auth", authRouter);

server.use("/api/profile", profileRouter);

server.use("/api/category", categoryRouter);
server.use("/api/room", roomRouter);
server.use("/api/product", productRouter);
server.use("/api/store-page-hero", storePageHeroSectionRouter);
server.use("/api/home-page-hero", homepageherosectionRouter);
server.use("/api/addresses", addressRouter);
server.use("/api/orders", orderRouter);

// ==========================================
// DATABASE CONNECTION
// ==========================================

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing in backend .env");
  process.exit(1);
}

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("Database Connected");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "Database connection failed:",
      error.message
    );

    process.exit(1);
  });
