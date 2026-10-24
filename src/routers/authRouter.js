
import express from "express";

import {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/auth.controller.js";

import {
  changePassword,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
} from "../controllers/security.controller.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Registration OTP
router.post("/send-otp", sendRegistrationOtp);
router.post("/verify-otp", verifyRegistrationOtp);

// Login and logout
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Current logged-in user
router.get("/me", authenticateUser, getCurrentUser);

// Change password
router.put(
  "/change-password",
  authenticateUser,
  changePassword
);

// Change email
router.post(
  "/email-change/send-otp",
  authenticateUser,
  sendEmailChangeOtp
);

router.post(
  "/email-change/verify-otp",
  authenticateUser,
  verifyEmailChangeOtp
);

export default router;
