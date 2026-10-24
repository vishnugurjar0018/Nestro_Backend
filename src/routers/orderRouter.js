
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";

import {
  createCODOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
} from "../controllers/order.controller.js";

const router = express.Router();

// Get logged-in user's orders
router.get("/my-orders", authenticateUser, getMyOrders);

// Place Cash on Delivery order
router.post("/cod", authenticateUser, createCODOrder);

// Create Razorpay payment order
router.post("/razorpay/create", authenticateUser, createRazorpayOrder);

// Verify Razorpay payment
router.post("/razorpay/verify", authenticateUser, verifyRazorpayPayment);

export default router;
