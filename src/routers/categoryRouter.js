import express from "express";

import {
    readById,
    deleteById,
    updateStatus,
    readAll,
    create,
    update
} from "../controllers/category.controller.js";

import upload from "../middleware/upload.js";

const router = express.Router();


// GET ALL CATEGORIES
router.get("/", readAll);


// CREATE CATEGORY
router.post(
    "/create",
    (req, res, next) => {
        console.log("UPLOAD START");

        upload.single("image")(req, res, (err) => {

            if (err) {
                console.log("===== UPLOAD ERROR =====");
                console.log(err);
                console.log("MESSAGE:", err.message);
                console.log("NAME:", err.name);
                console.log("========================");

                return res.status(400).json({
                    success: false,
                    message: err.message,
                    error: err
                });
            }

            console.log("UPLOAD SUCCESS");
            console.log("FILE:", req.file);

            next();
        });
    },
    create
);


// GET CATEGORY BY ID
router.get("/:id", readById);


// DELETE CATEGORY
router.delete("/:id", deleteById);


// UPDATE CATEGORY STATUS
router.patch("/status/:id", updateStatus);


// UPDATE CATEGORY
router.patch(
    "/:id",
    upload.single("image"),
    update
);


export default router;