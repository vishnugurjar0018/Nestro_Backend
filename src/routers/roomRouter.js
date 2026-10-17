import express from "express";

import {
    readById,
    deleteById,
    updateStatus,
    readAll,
    create,
    update
} from "../controllers/room.controller.js";

import upload from "../middleware/upload.js";

const router = express.Router();


// =====================================================
// GET ALL ROOMS
// =====================================================

router.get("/", readAll);


// =====================================================
// CREATE ROOM
// =====================================================

router.post(
    "/create",
    (req, res, next) => {

        console.log("ROOM UPLOAD START");

        upload.single("image")(req, res, (err) => {

            if (err) {

                console.log("===== ROOM UPLOAD ERROR =====");
                console.log(err);
                console.log("MESSAGE:", err.message);
                console.log("NAME:", err.name);
                console.log("=============================");

                return res.status(400).json({
                    success: false,
                    message: err.message,
                    error: err
                });
            }

            console.log("ROOM UPLOAD SUCCESS");
            console.log("FILE:", req.file);

            next();
        });
    },
    create
);


// =====================================================
// GET ROOM BY ID
// =====================================================

router.get("/:id", readById);


// =====================================================
// DELETE ROOM
// =====================================================

router.delete("/:id", deleteById);


// =====================================================
// UPDATE ROOM STATUS
// =====================================================

router.patch(
    "/status/:id",
    updateStatus
);


// =====================================================
// UPDATE ROOM
// =====================================================

router.patch(
    "/:id",
    upload.single("image"),
    update
);


export default router;