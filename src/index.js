import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import categoryRouter from "./routers/categoryRouter.js";
import roomRouter from "./routers/roomRouter.js";
import productRouter from "./routers/productRouter.js";
import storePageHeroSectionRouter from "./routers/storepageherosectionRouter.js";
import homepageherosectionRouter from "./routers/homepageherosectionRouter.js";

const server = express();

// =====================================================
// MIDDLEWARE
// =====================================================

server.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PATCH", "DELETE"],
}));

server.use(express.json());



server.use("/api/category", categoryRouter);
server.use("/api/room", roomRouter);
server.use("/api/product", productRouter);
server.use("/api/store-page-hero", storePageHeroSectionRouter);
server.use("/api/home-page-hero", homepageherosectionRouter);

// =====================================================
// DATABASE CONNECTION
// =====================================================

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("Database Connected");

    server.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Database not Connected");
    console.log(error.message);
  });