import express from "express";

import {
    readAll,
    readById,
    create,
    update,
    deleteById,
    updateStatus,
} from "../controllers/homepageherosection.controller.js";

import websiteContentUpload from "../middleware/websiteContentUpload.js";

const router = express.Router();


// GET ALL
router.get("/", readAll);


// CREATE
router.post(
    "/create",
    websiteContentUpload.single("image"),
    create
);


// UPDATE STATUS
router.patch(
    "/status/:id",
    updateStatus
);


// GET BY ID
router.get(
    "/:id",
    readById
);


// UPDATE
router.patch(
    "/:id",
    websiteContentUpload.single("image"),
    update
);


// DELETE
router.delete(
    "/:id",
    deleteById
);


export default router;