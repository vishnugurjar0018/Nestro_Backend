import express from "express";

import {
    readById,
    deleteById,
    updateStatus,
    readAll,
    create,
    update,
    deleteProductImage
} from "../controllers/product.controller.js";

import productUpload from "../middleware/productUpload.js";

const router = express.Router();


// =====================================================
// GET ALL PRODUCTS
// =====================================================

router.get(
    "/",
    readAll
);


// =====================================================
// CREATE PRODUCT
// =====================================================

router.post(
    "/create",

    (req, res, next) => {

        console.log(
            "PRODUCT UPLOAD START"
        );

        productUpload.fields([
            {
                name: "thumbnail",
                maxCount: 1
            },
            {
                name: "images",
                maxCount: 10
            }
        ])(
            req,
            res,
            (err) => {

                if (err) {

                    console.log(
                        "===== PRODUCT UPLOAD ERROR ====="
                    );

                    console.log(err);

                    console.log(
                        "MESSAGE:",
                        err.message
                    );

                    console.log(
                        "NAME:",
                        err.name
                    );

                    console.log(
                        "================================"
                    );

                    return res.status(400).json({
                        success: false,
                        message: err.message,
                        error: err
                    });

                }

                console.log(
                    "PRODUCT UPLOAD SUCCESS"
                );

                console.log(
                    "FILES:",
                    req.files
                );

                next();

            }
        );

    },

    create
);


// =====================================================
// DELETE EXISTING GALLERY IMAGE
// =====================================================
//
// DELETE
// /api/product/images/:id
//
// Body:
// {
//     imageUrl: "cloudinary image url"
// }
//

router.delete(
    "/images/:id",
    deleteProductImage
);


// =====================================================
// GET PRODUCT BY ID
// =====================================================

router.get(
    "/:id",
    readById
);


// =====================================================
// DELETE PRODUCT
// =====================================================

router.delete(
    "/:id",
    deleteById
);


// =====================================================
// UPDATE PRODUCT STATUS
// =====================================================

router.patch(
    "/status/:id",
    updateStatus
);


// =====================================================
// UPDATE PRODUCT
// =====================================================

router.patch(
    "/:id",

    (req, res, next) => {

        console.log(
            "PRODUCT UPDATE UPLOAD START"
        );

        productUpload.fields([
            {
                name: "thumbnail",
                maxCount: 1
            },
            {
                name: "images",
                maxCount: 10
            }
        ])(
            req,
            res,
            (err) => {

                if (err) {

                    console.log(
                        "===== PRODUCT UPDATE UPLOAD ERROR ====="
                    );

                    console.log(err);

                    console.log(
                        "MESSAGE:",
                        err.message
                    );

                    return res.status(400).json({
                        success: false,
                        message: err.message,
                        error: err
                    });

                }

                console.log(
                    "PRODUCT UPDATE UPLOAD SUCCESS"
                );

                console.log(
                    "UPDATE FILES:",
                    req.files
                );

                next();

            }
        );

    },

    update
);


export default router;