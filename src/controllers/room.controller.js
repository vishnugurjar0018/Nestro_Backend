import RoomModel from "../models/room.model.js";

import {
    createdResponse,
    successResponse,
    notFoundResponse,
    conflictResponse,
    serverErrorResponse
} from "../utils/response.js";


// =====================================================
// CREATE ROOM
// =====================================================

const create = async (req, res) => {
    try {

        console.log("BODY:", req.body);
        console.log("FILE:", req.file);

        const { name, slug, status } = req.body;

        // Check duplicate room
        const existingRoom = await RoomModel.findOne({
            $or: [
                { name: name },
                { slug: slug }
            ]
        });

        if (existingRoom) {
            return conflictResponse(
                res,
                "Room already exists"
            );
        }

        // Image URL from Cloudinary
        const image = req.file ? req.file.path : null;

        const room = new RoomModel({
            name,
            slug,
            image,
            status
        });

        const result = await room.save();

        return createdResponse(
            res,
            "Room created successfully",
            result
        );

    } catch (error) {

        console.log("CREATE ROOM ERROR:", error);
        console.log("ERROR MESSAGE:", error.message);
        console.log("ERROR STACK:", error.stack);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// READ ALL ROOMS
// =====================================================

const readAll = async (req, res) => {
    try {

        const rooms = await RoomModel.find();

        return successResponse(
            res,
            "Rooms fetched successfully",
            rooms
        );

    } catch (error) {

        console.log("READ ALL ROOM ERROR:", error);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// READ ROOM BY ID
// =====================================================

const readById = async (req, res) => {
    try {

        const { id } = req.params;

        const room = await RoomModel.findById(id);

        if (!room) {
            return notFoundResponse(
                res,
                "Room not found"
            );
        }

        return successResponse(
            res,
            "Room fetched successfully",
            room
        );

    } catch (error) {

        console.log("READ ROOM BY ID ERROR:", error);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// DELETE ROOM
// =====================================================

const deleteById = async (req, res) => {
    try {

        const { id } = req.params;

        const room = await RoomModel.findById(id);

        if (!room) {
            return notFoundResponse(
                res,
                "Room not found"
            );
        }

        await RoomModel.findByIdAndDelete(id);

        return successResponse(
            res,
            "Room deleted successfully"
        );

    } catch (error) {

        console.log("DELETE ROOM ERROR:", error);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// UPDATE ROOM STATUS
// =====================================================

const updateStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { status } = req.body;

        const room = await RoomModel.findById(id);

        if (!room) {
            return notFoundResponse(
                res,
                "Room not found"
            );
        }

        room.status = status;

        const result = await room.save();

        return successResponse(
            res,
            "Room status updated successfully",
            result
        );

    } catch (error) {

        console.log("ROOM STATUS ERROR:", error);

        return serverErrorResponse(
            res,
            error.message
        );
    }
};


// =====================================================
// UPDATE ROOM
// =====================================================

const update = async (req, res) => {
    try {

        const { id } = req.params;
        const { name, slug, status } = req.body;

        const room = await RoomModel.findById(id);

        if (!room) {
            return notFoundResponse(
                res,
                "Room not found"
            );
        }

        // Check duplicate name or slug
        const existingRoom = await RoomModel.findOne({
            $or: [
                { name: name },
                { slug: slug }
            ],
            _id: { $ne: id }
        });

        if (existingRoom) {
            return conflictResponse(
                res,
                "Room name or slug already exists"
            );
        }

        // Update room details
        room.name = name;
        room.slug = slug;
        room.status = status;

        // If new image is uploaded
        if (req.file) {
            room.image = req.file.path;
        }

        const result = await room.save();

        return successResponse(
            res,
            "Room updated successfully",
            result
        );

    } catch (error) {

        console.log("UPDATE ROOM ERROR:", error);

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