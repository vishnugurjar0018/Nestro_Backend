import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/catergrory.model.js";
import RoomModel from "../models/room.model.js";
import cloudinary from "../config/cloudinary.js";

import {
    createdResponse,
    successResponse,
    notFoundResponse,
    conflictResponse,
    serverErrorResponse,
    badResponse
} from "../utils/response.js";


// =====================================================
// CREATE PRODUCT
// =====================================================

const create = async (req, res) => {
    try {

        console.log("PRODUCT BODY:", req.body);
        console.log("PRODUCT FILES:", req.files);


        const {
            name,
            slug,
            shortDescription,
            description,
            categoryID,
            roomID,
            price,
            discount,
            stock,
            material,
            color,
            dimensions,
            weight,
            featured,
            newArrival,
            status
        } = req.body;


        // =================================================
        // REQUIRED VALIDATION
        // =================================================

        if (!name || !slug) {
            return badResponse(
                res,
                "Product name and slug are required"
            );
        }


        if (!categoryID) {
            return badResponse(
                res,
                "Category is required"
            );
        }


        if (!roomID) {
            return badResponse(
                res,
                "Room is required"
            );
        }


        if (!price) {
            return badResponse(
                res,
                "Product price is required"
            );
        }


        // =================================================
        // THUMBNAIL CHECK
        // =================================================

        if (
            !req.files ||
            !req.files.thumbnail ||
            !req.files.thumbnail[0]
        ) {
            return badResponse(
                res,
                "Product thumbnail is required"
            );
        }


        // =================================================
        // VALIDATE OBJECT IDS
        // =================================================

        if (!mongoose.Types.ObjectId.isValid(categoryID)) {
            return badResponse(
                res,
                "Invalid category"
            );
        }


        if (!mongoose.Types.ObjectId.isValid(roomID)) {
            return badResponse(
                res,
                "Invalid room"
            );
        }


        // =================================================
        // CHECK CATEGORY
        // =================================================

        const category = await CategoryModel.findById(
            categoryID
        );

        if (!category) {
            return notFoundResponse(
                res,
                "Category not found"
            );
        }


        // =================================================
        // CHECK ROOM
        // =================================================

        const room = await RoomModel.findById(
            roomID
        );

        if (!room) {
            return notFoundResponse(
                res,
                "Room not found"
            );
        }


        // =================================================
        // CHECK DUPLICATE PRODUCT
        // =================================================

        const existingProduct = await ProductModel.findOne({
            $or: [
                { name: name.trim() },
                { slug: slug.trim().toLowerCase() }
            ]
        });


        if (existingProduct) {
            return conflictResponse(
                res,
                "Product name or slug already exists"
            );
        }


        // =================================================
        // THUMBNAIL
        // =================================================

        const thumbnail =
            req.files.thumbnail[0].path;


        // =================================================
        // GALLERY IMAGES
        // =================================================

        const images = req.files.images
            ? req.files.images.map(
                (file) => file.path
            )
            : [];


        // =================================================
        // PARSE DIMENSIONS
        // =================================================

        let parsedDimensions = {};

        if (dimensions) {

            try {

                parsedDimensions =
                    typeof dimensions === "string"
                        ? JSON.parse(dimensions)
                        : dimensions;

            } catch (error) {

                return badResponse(
                    res,
                    "Invalid dimensions format"
                );

            }

        }


        // =================================================
        // PARSE WEIGHT
        // =================================================

        let parsedWeight = {};

        if (weight) {

            try {

                parsedWeight =
                    typeof weight === "string"
                        ? JSON.parse(weight)
                        : weight;

            } catch (error) {

                return badResponse(
                    res,
                    "Invalid weight format"
                );

            }

        }


        // =================================================
        // CREATE PRODUCT
        // =================================================

        const product = new ProductModel({

            name: name.trim(),

            slug: slug.trim().toLowerCase(),

            shortDescription,

            description,

            categoryID,

            roomID,

            price: Number(price),

            discount:
                discount !== undefined
                    ? Number(discount)
                    : 0,

            stock:
                stock !== undefined
                    ? stock === "true" ||
                      stock === true
                    : true,

            thumbnail,

            images,

            material:
                material || "Wood",

            color,

            dimensions: parsedDimensions,

            weight: parsedWeight,

            featured:
                featured === "true" ||
                featured === true,

            newArrival:
                newArrival === "true" ||
                newArrival === true,

            status:
                status !== undefined
                    ? status === "true" ||
                      status === true
                    : true

        });


        // =================================================
        // SAVE
        // =================================================

        const result = await product.save();


        return createdResponse(
            res,
            "Product created successfully",
            result
        );


    } catch (error) {

        console.log(
            "CREATE PRODUCT ERROR:",
            error
        );

        console.log(
            "ERROR MESSAGE:",
            error.message
        );

        console.log(
            "ERROR STACK:",
            error.stack
        );


        return serverErrorResponse(
            res,
            error.message
        );

    }
};


// =====================================================
// READ ALL PRODUCTS
// =====================================================

// =====================================================
// READ ALL PRODUCTS
// FILTER + MULTI FILTER + SORT + PAGINATION
// =====================================================

const readAll = async (req, res) => {
    try {

        // =================================================
        // PAGINATION
        // =================================================

        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Number(req.query.limit) || 6,
            50
        );

        const skip = (page - 1) * limit;


        // =================================================
        // HELPER
        // Convert query parameter into array
        //
        // Example:
        //
        // ?category=id1&category=id2
        //
        // becomes:
        //
        // ["id1", "id2"]
        // =================================================

        const toArray = (value) => {

            if (
                value === undefined ||
                value === null
            ) {
                return [];
            }

            if (Array.isArray(value)) {
                return value.filter(Boolean);
            }

            return [value].filter(Boolean);
        };


        // =================================================
        // GET FILTER VALUES
        // =================================================

        const categoryIds =
            toArray(
                req.query.category
            );

        const roomIds =
            toArray(
                req.query.room
            );

        const materials =
            toArray(
                req.query.material
            );

        const colors =
            toArray(
                req.query.color
            );


        // =================================================
        // PRICE
        // =================================================

        const minPrice =
            req.query.minPrice !== undefined &&
            req.query.minPrice !== ""
                ? Number(req.query.minPrice)
                : null;


        const maxPrice =
            req.query.maxPrice !== undefined &&
            req.query.maxPrice !== ""
                ? Number(req.query.maxPrice)
                : null;


        // =================================================
        // SORT
        // =================================================

        const sortType =
            req.query.sort || "featured";


        // =================================================
        // BUILD QUERY
        // =================================================

        const query = {};


        // =================================================
        // CATEGORY FILTER
        // =================================================

        if (categoryIds.length > 0) {

            const validCategoryIds =
                categoryIds.filter(
                    (id) =>
                        mongoose.Types.ObjectId.isValid(
                            id
                        )
                );


            if (
                validCategoryIds.length > 0
            ) {

                query.categoryID = {
                    $in: validCategoryIds
                };

            } else {

                // IDs supplied but all invalid
                query.categoryID = {
                    $in: []
                };

            }
        }


        // =================================================
        // ROOM FILTER
        // =================================================

        if (roomIds.length > 0) {

            const validRoomIds =
                roomIds.filter(
                    (id) =>
                        mongoose.Types.ObjectId.isValid(
                            id
                        )
                );


            if (
                validRoomIds.length > 0
            ) {

                query.roomID = {
                    $in: validRoomIds
                };

            } else {

                query.roomID = {
                    $in: []
                };

            }
        }


        // =================================================
        // MATERIAL FILTER
        // =================================================

        if (
            materials.length > 0
        ) {

            query.material = {
                $in: materials
            };

        }


        // =================================================
        // COLOR FILTER
        // =================================================

        if (
            colors.length > 0
        ) {

            query.color = {
                $in: colors
            };

        }


        // =================================================
        // PRICE FILTER
        // =================================================

        if (
            minPrice !== null &&
            !Number.isNaN(minPrice)
        ) {

            query.price = {
                ...(query.price || {}),
                $gte: minPrice
            };

        }


        if (
            maxPrice !== null &&
            !Number.isNaN(maxPrice)
        ) {

            query.price = {
                ...(query.price || {}),
                $lte: maxPrice
            };

        }


        // =================================================
        // ONLY ACTIVE PRODUCTS
        // =================================================

        query.status = true;


        // =================================================
        // SORT QUERY
        // =================================================

        let sortQuery = {
            featured: -1,
            createdAt: -1
        };


        switch (sortType) {

            // ---------------------------------------------
            // FEATURED
            // ---------------------------------------------

            case "featured":

                sortQuery = {
                    featured: -1,
                    createdAt: -1
                };

                break;


            // ---------------------------------------------
            // NEWEST
            // ---------------------------------------------

            case "newest":

                sortQuery = {
                    createdAt: -1
                };

                break;


            // ---------------------------------------------
            // PRICE LOW TO HIGH
            // ---------------------------------------------

            case "price-low":

                sortQuery = {
                    price: 1
                };

                break;


            // ---------------------------------------------
            // PRICE HIGH TO LOW
            // ---------------------------------------------

            case "price-high":

                sortQuery = {
                    price: -1
                };

                break;


            // ---------------------------------------------
            // NAME A TO Z
            // ---------------------------------------------

            case "name-asc":

                sortQuery = {
                    name: 1
                };

                break;


            // ---------------------------------------------
            // NAME Z TO A
            // ---------------------------------------------

            case "name-desc":

                sortQuery = {
                    name: -1
                };

                break;


            // ---------------------------------------------
            // DEFAULT
            // ---------------------------------------------

            default:

                sortQuery = {
                    featured: -1,
                    createdAt: -1
                };

                break;
        }


        // =================================================
        // DEBUG
        // =================================================

        console.log(
            "===================================="
        );

        console.log(
            "PRODUCT QUERY:",
            query
        );

        console.log(
            "PRODUCT SORT:",
            sortQuery
        );

        console.log(
            "PAGE:",
            page
        );

        console.log(
            "LIMIT:",
            limit
        );

        console.log(
            "===================================="
        );


        // =================================================
        // TOTAL FILTERED PRODUCTS
        // =================================================

        const totalProducts =
            await ProductModel.countDocuments(
                query
            );


        // =================================================
        // TOTAL PAGES
        // =================================================

        const totalPages =
            Math.ceil(
                totalProducts / limit
            );


        // =================================================
        // PRODUCTS
        // =================================================

        const products =
            await ProductModel
                .find(query)

                .populate(
                    "categoryID",
                    "name slug"
                )

                .populate(
                    "roomID",
                    "name slug"
                )

                .sort(
                    sortQuery
                )

                .skip(
                    skip
                )

                .limit(
                    limit
                );


        // =================================================
        // RESPONSE
        // =================================================

        return successResponse(
            res,
            "Products fetched successfully",
            {

                products,

                pagination: {

                    currentPage:
                        page,

                    totalPages:
                        totalPages,

                    totalProducts:
                        totalProducts,

                    limit:
                        limit

                }

            }
        );


    } catch (error) {

        console.log(
            "READ ALL PRODUCT ERROR:",
            error
        );


        return serverErrorResponse(
            res,
            error.message
        );

    }
};




// =====================================================
// READ PRODUCT BY ID
// =====================================================

const readById = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return badResponse(
                res,
                "Invalid product ID"
            );
        }


        const product = await ProductModel
            .findById(id)
            .populate(
                "categoryID",
                "name slug"
            )
            .populate(
                "roomID",
                "name slug"
            );


        if (!product) {
            return notFoundResponse(
                res,
                "Product not found"
            );
        }


        return successResponse(
            res,
            "Product fetched successfully",
            product
        );


    } catch (error) {

        console.log(
            "READ PRODUCT BY ID ERROR:",
            error
        );


        return serverErrorResponse(
            res,
            error.message
        );

    }
};


// =====================================================
// DELETE PRODUCT
// =====================================================

const deleteById = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return badResponse(
                res,
                "Invalid product ID"
            );
        }


        const product = await ProductModel.findById(
            id
        );


        if (!product) {
            return notFoundResponse(
                res,
                "Product not found"
            );
        }


        await ProductModel.findByIdAndDelete(
            id
        );


        return successResponse(
            res,
            "Product deleted successfully"
        );


    } catch (error) {

        console.log(
            "DELETE PRODUCT ERROR:",
            error
        );


        return serverErrorResponse(
            res,
            error.message
        );

    }
};


// =====================================================
// UPDATE PRODUCT STATUS
// =====================================================

const updateStatus = async (req, res) => {
    try {

        const { id } = req.params;

        const { status } = req.body;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return badResponse(
                res,
                "Invalid product ID"
            );
        }


        const product = await ProductModel.findById(
            id
        );


        if (!product) {
            return notFoundResponse(
                res,
                "Product not found"
            );
        }


        product.status =
            status === true ||
            status === "true";


        const result = await product.save();


        return successResponse(
            res,
            "Product status updated successfully",
            result
        );


    } catch (error) {

        console.log(
            "PRODUCT STATUS ERROR:",
            error
        );


        return serverErrorResponse(
            res,
            error.message
        );

    }
};


// =====================================================
// UPDATE PRODUCT
// =====================================================

const update = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {
            return badResponse(
                res,
                "Invalid product ID"
            );
        }


        const {
            name,
            slug,
            shortDescription,
            description,
            categoryID,
            roomID,
            price,
            discount,
            stock,
            material,
            color,
            dimensions,
            weight,
            featured,
            newArrival,
            status
        } = req.body;


        // =================================================
        // FIND PRODUCT
        // =================================================

        const product = await ProductModel.findById(
            id
        );


        if (!product) {
            return notFoundResponse(
                res,
                "Product not found"
            );
        }


        // =================================================
        // DUPLICATE CHECK
        // =================================================

        const existingProduct =
            await ProductModel.findOne({

                $or: [
                    {
                        name:
                            name?.trim()
                    },
                    {
                        slug:
                            slug?.trim().toLowerCase()
                    }
                ],

                _id: {
                    $ne: id
                }

            });


        if (existingProduct) {

            return conflictResponse(
                res,
                "Product name or slug already exists"
            );

        }


        // =================================================
        // CATEGORY VALIDATION
        // =================================================

        if (categoryID) {

            if (
                !mongoose.Types.ObjectId.isValid(
                    categoryID
                )
            ) {

                return badResponse(
                    res,
                    "Invalid category"
                );

            }


            const category =
                await CategoryModel.findById(
                    categoryID
                );


            if (!category) {

                return notFoundResponse(
                    res,
                    "Category not found"
                );

            }

        }


        // =================================================
        // ROOM VALIDATION
        // =================================================

        if (roomID) {

            if (
                !mongoose.Types.ObjectId.isValid(
                    roomID
                )
            ) {

                return badResponse(
                    res,
                    "Invalid room"
                );

            }


            const room =
                await RoomModel.findById(
                    roomID
                );


            if (!room) {

                return notFoundResponse(
                    res,
                    "Room not found"
                );

            }

        }


        // =================================================
        // UPDATE BASIC DETAILS
        // =================================================

        if (name !== undefined) {
            product.name = name.trim();
        }


        if (slug !== undefined) {
            product.slug =
                slug.trim().toLowerCase();
        }


        if (shortDescription !== undefined) {
            product.shortDescription =
                shortDescription;
        }


        if (description !== undefined) {
            product.description =
                description;
        }


        if (categoryID !== undefined) {
            product.categoryID =
                categoryID;
        }


        if (roomID !== undefined) {
            product.roomID =
                roomID;
        }


        if (price !== undefined) {
            product.price =
                Number(price);
        }


        if (discount !== undefined) {

            product.discount =
                Number(discount);

        }


        if (stock !== undefined) {

            product.stock =
                stock === true ||
                stock === "true";

        }


        if (material !== undefined) {
            product.material =
                material;
        }


        if (color !== undefined) {
            product.color =
                color;
        }


        // =================================================
        // DIMENSIONS
        // =================================================

        if (dimensions !== undefined) {

            try {

                product.dimensions =
                    typeof dimensions === "string"
                        ? JSON.parse(dimensions)
                        : dimensions;

            } catch (error) {

                return badResponse(
                    res,
                    "Invalid dimensions format"
                );

            }

        }


        // =================================================
        // WEIGHT
        // =================================================

        if (weight !== undefined) {

            try {

                product.weight =
                    typeof weight === "string"
                        ? JSON.parse(weight)
                        : weight;

            } catch (error) {

                return badResponse(
                    res,
                    "Invalid weight format"
                );

            }

        }


        // =================================================
        // FEATURED
        // =================================================

        if (featured !== undefined) {

            product.featured =
                featured === true ||
                featured === "true";

        }


        // =================================================
        // NEW ARRIVAL
        // =================================================

        if (newArrival !== undefined) {

            product.newArrival =
                newArrival === true ||
                newArrival === "true";

        }


        // =================================================
        // STATUS
        // =================================================

        if (status !== undefined) {

            product.status =
                status === true ||
                status === "true";

        }


        // =================================================
        // NEW THUMBNAIL
        // =================================================

        if (
            req.files &&
            req.files.thumbnail &&
            req.files.thumbnail[0]
        ) {

            product.thumbnail =
                req.files.thumbnail[0].path;

        }


        // =================================================
        // NEW GALLERY IMAGES
        // =================================================

        if (
            req.files &&
            req.files.images &&
            req.files.images.length > 0
        ) {

            const newImages =
                req.files.images.map(
                    (file) => file.path
                );


            product.images = [
                ...(product.images || []),
                ...newImages
            ];

        }


        // =================================================
        // SAVE
        // =================================================

        const result =
            await product.save();


        return successResponse(
            res,
            "Product updated successfully",
            result
        );


    } catch (error) {

        console.log(
            "UPDATE PRODUCT ERROR:",
            error
        );


        return serverErrorResponse(
            res,
            error.message
        );

    }
};


// =====================================================
// DELETE PRODUCT GALLERY IMAGE
// =====================================================

export const deleteProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return badResponse(
                res,
                "Invalid product ID"
            );
        }

        if (!imageUrl) {
            return badResponse(
                res,
                "Image URL is required"
            );
        }

        const product = await ProductModel.findById(id);

        if (!product) {
            return badResponse(
                res,
                "Product not found"
            );
        }

        // Check image exists in product
        const imageExists = product.images?.includes(
            imageUrl
        );

        if (!imageExists) {
            return badResponse(
                res,
                "Image not found in this product"
            );
        }

        // =====================================================
        // REMOVE IMAGE FROM MONGODB
        // =====================================================

        product.images = product.images.filter(
            (image) => image !== imageUrl
        );

        await product.save();

        // =====================================================
        // DELETE IMAGE FROM CLOUDINARY
        // =====================================================

        try {
            const uploadIndex =
                imageUrl.indexOf("/upload/");

            if (uploadIndex !== -1) {
                let publicId = imageUrl.substring(
                    uploadIndex + "/upload/".length
                );

                // Remove version
                // Example:
                // v1788863310/products/abc.jpg
                publicId = publicId.replace(
                    /^v\d+\//,
                    ""
                );

                // Remove extension
                // products/abc.jpg
                publicId = publicId.replace(
                    /\.[^/.]+$/,
                    ""
                );

                console.log(
                    "CLOUDINARY PUBLIC ID:",
                    publicId
                );

                await cloudinary.uploader.destroy(
                    publicId,
                    {
                        resource_type: "image"
                    }
                );

                console.log(
                    "CLOUDINARY IMAGE DELETED"
                );
            }
        } catch (cloudinaryError) {
            console.log(
                "CLOUDINARY DELETE ERROR:",
                cloudinaryError.message
            );

            // MongoDB se image already remove ho chuki hai.
            // Cloudinary delete fail hone par API ko fail nahi karenge.
        }

        return createdResponse(
            res,
            "Product image deleted successfully",
            product
        );

    } catch (error) {
        console.log(
            "DELETE PRODUCT IMAGE ERROR:",
            error
        );

        return badResponse(
            res,
            error.message
        );
    }
};

// =====================================================
// EXPORT
// =====================================================

export {
    create,
    readAll,
    readById,
    deleteById,
    updateStatus,
    update
};