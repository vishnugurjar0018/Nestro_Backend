
import express from "express";

import { authenticateUser } from "../middleware/authMiddleware.js";

import {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Email OTP registration
router.post("/send-otp", sendRegistrationOtp);
router.post("/verify-otp", verifyRegistrationOtp);

// Login and logout
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Get currently logged-in user
router.get("/me", authenticateUser, getCurrentUser);

export default router;
