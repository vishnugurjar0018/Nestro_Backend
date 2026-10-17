import express from "express";

import {
    readAll,
    readById,
    create,
    update,
    deleteById,
    updateStatus
} from "../controllers/storepageherosection.controller.js";

import websiteContentUpload from "../middleware/websiteContentUpload.js";

const router = express.Router();


// =====================================================
// GET ALL HERO SECTIONS
// GET /api/store-page-hero
// =====================================================

router.get(
    "/",
    readAll
);


// =====================================================
// CREATE HERO SECTION
// POST /api/store-page-hero/create
// =====================================================

router.post(
    "/create",
    websiteContentUpload.single("image"),
    create
);


// =====================================================
// UPDATE HERO STATUS
// PATCH /api/store-page-hero/status/:id
// =====================================================

router.patch(
    "/status/:id",
    updateStatus
);


// =====================================================
// GET HERO SECTION BY ID
// GET /api/store-page-hero/:id
// =====================================================

router.get(
    "/:id",
    readById
);


// =====================================================
// UPDATE HERO SECTION
// PATCH /api/store-page-hero/:id
// =====================================================

router.patch(
    "/:id",
    websiteContentUpload.single("image"),
    update
);


// =====================================================
// DELETE HERO SECTION
// DELETE /api/store-page-hero/:id
// =====================================================

router.delete(
    "/:id",
    deleteById
);


export default router;