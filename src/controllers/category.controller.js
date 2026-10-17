import CategoryModel from "../models/catergrory.model.js";

import {
    createdResponse,
    successResponse,
    notFoundResponse,
    conflictResponse,
    serverErrorResponse
} from "../utils/response.js";


// =====================================================
// CREATE CATEGORY
// =====================================================

const create = async (req, res) => {
    try {

        console.log("BODY:", req.body);
        console.log("FILE:", req.file);

        const { name, slug, status } = req.body;

        // Check duplicate category
        const existingCategory = await CategoryModel.findOne({
            $or: [
                { name: name },
                { slug: slug }
            ]
        });

        if (existingCategory) {
            return conflictResponse(
                res,
                "Category already exists"
            );
        }

        // Image URL from Cloudinary
        const image = req.file ? req.file.path : null;

        const category = new CategoryModel({
            name,
            slug,
            image,
            status
        });

        const result = await category.save();

        return createdResponse(
            res,
            "Category created successfully",
            result
        );

    } catch (error) {

        console.log("CREATE CATEGORY ERROR:", error);
        console.log("ERROR MESSAGE:", error.message);
        console.log("ERROR STACK:", error.stack);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// READ ALL
// =====================================================

const readAll = async (req, res) => {
    try {

        const categories = await CategoryModel.find();

        return successResponse(
            res,
            "Categories fetched successfully",
            categories
        );

    } catch (error) {

        console.log("READ ALL ERROR:", error);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// READ BY ID
// =====================================================

const readById = async (req, res) => {
    try {

        const { id } = req.params;

        const category = await CategoryModel.findById(id);

        if (!category) {
            return notFoundResponse(
                res,
                "Category not found"
            );
        }

        return successResponse(
            res,
            "Category fetched successfully",
            category
        );

    } catch (error) {

        console.log("READ BY ID ERROR:", error);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// DELETE
// =====================================================

const deleteById = async (req, res) => {
    try {

        const { id } = req.params;

        const category = await CategoryModel.findById(id);

        if (!category) {
            return notFoundResponse(
                res,
                "Category not found"
            );
        }

        await CategoryModel.findByIdAndDelete(id);

        return successResponse(
            res,
            "Category deleted successfully"
        );

    } catch (error) {

        console.log("DELETE ERROR:", error);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// UPDATE STATUS
// =====================================================

const updateStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { status } = req.body;

        const category = await CategoryModel.findById(id);

        if (!category) {
            return notFoundResponse(
                res,
                "Category not found"
            );
        }

        category.status = status;

        const result = await category.save();

        return successResponse(
            res,
            "Category status updated successfully",
            result
        );

    } catch (error) {

        console.log("STATUS ERROR :", error);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};

const update = async (req, res) => {
    try {

        const { id } = req.params;
        const { name, slug, status } = req.body;

        const category = await CategoryModel.findById(id);

        if (!category) {
            return notFoundResponse(
                res,
                "Category not found"
            );
        }

        // Check duplicate name or slug
        const existingCategory = await CategoryModel.findOne({
            $or: [
                { name: name },
                { slug: slug }
            ],
            _id: { $ne: id }
        });

        if (existingCategory) {
            return conflictResponse(
                res,
                "Category name or slug already exists"
            );
        }

        // Update category details
        category.name = name;
        category.slug = slug;
        category.status = status;

        // If new image is uploaded
        if (req.file) {
            category.image = req.file.path;
        }

        const result = await category.save();

        return successResponse(
            res,
            "Category updated successfully",
            result
        );

    } catch (error) {

        console.log("UPDATE CATEGORY ERROR :", error);

        return serverErrorResponse(
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
    readById,
    deleteById,
    updateStatus,
    readAll,
    update
};