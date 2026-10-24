
import express from "express";

import {
    getProfile,
    updateProfile,
} from "../controllers/profile.controller.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in user's profile
// GET /api/profile
router.get("/", authenticateUser, getProfile);

// Update logged-in user's profile
// PUT /api/profile
router.put("/", authenticateUser, updateProfile);

export default router;
