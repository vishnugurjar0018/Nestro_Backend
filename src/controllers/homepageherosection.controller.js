import HomePageHeroSectionModel from "../models/homepageherosection.model.js";


// =====================================================
// GET ALL HOME HERO SECTIONS
// =====================================================

export const readAll = async (req, res) => {
    try {
        const data = await HomePageHeroSectionModel.find()
            .sort({ sortOrder: 1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Home hero sections fetched successfully",
            data,
        });
    } catch (error) {
        console.error("Home Hero Read All Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch home hero sections",
            error: error.message,
        });
    }
};


// =====================================================
// GET HOME HERO BY ID
// =====================================================

export const readById = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await HomePageHeroSectionModel.findById(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Home hero section not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Home hero section fetched successfully",
            data,
        });
    } catch (error) {
        console.error("Home Hero Read By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch home hero section",
            error: error.message,
        });
    }
};


// =====================================================
// CREATE HOME HERO
// =====================================================

export const create = async (req, res) => {
    try {
        const {
            eyebrow,
            title,
            highlightedTitle,
            description,
            primaryButtonText,
            primaryButtonLink,
            secondaryButtonText,
            secondaryButtonLink,
            offerText,
            offerPercentage,
            status,
            sortOrder,
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        const image = req.file?.path || "";

        const newHero = await HomePageHeroSectionModel.create({
            eyebrow,
            title,
            highlightedTitle,
            description,
            primaryButtonText,
            primaryButtonLink,
            secondaryButtonText,
            secondaryButtonLink,
            image,
            offerText,
            offerPercentage:
                offerPercentage !== undefined
                    ? Number(offerPercentage)
                    : 0,
            status:
                status !== undefined
                    ? status === "true" || status === true
                    : true,
            sortOrder:
                sortOrder !== undefined
                    ? Number(sortOrder)
                    : 0,
        });

        return res.status(201).json({
            success: true,
            message: "Home hero section created successfully",
            data: newHero,
        });
    } catch (error) {
        console.error("Home Hero Create Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create home hero section",
            error: error.message,
        });
    }
};


// =====================================================
// UPDATE HOME HERO
// =====================================================

export const update = async (req, res) => {
    try {
        const { id } = req.params;

        const existingHero =
            await HomePageHeroSectionModel.findById(id);

        if (!existingHero) {
            return res.status(404).json({
                success: false,
                message: "Home hero section not found",
            });
        }

        const {
            eyebrow,
            title,
            highlightedTitle,
            description,
            primaryButtonText,
            primaryButtonLink,
            secondaryButtonText,
            secondaryButtonLink,
            offerText,
            offerPercentage,
            status,
            sortOrder,
        } = req.body;

        const updateData = {
            eyebrow,
            title,
            highlightedTitle,
            description,
            primaryButtonText,
            primaryButtonLink,
            secondaryButtonText,
            secondaryButtonLink,
            offerText,
            offerPercentage:
                offerPercentage !== undefined
                    ? Number(offerPercentage)
                    : existingHero.offerPercentage,
            status:
                status !== undefined
                    ? status === "true" || status === true
                    : existingHero.status,
            sortOrder:
                sortOrder !== undefined
                    ? Number(sortOrder)
                    : existingHero.sortOrder,
        };

        // New image uploaded
        if (req.file) {
            updateData.image = req.file.path;
        }

        const updatedHero =
            await HomePageHeroSectionModel.findByIdAndUpdate(
                id,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            );

        return res.status(200).json({
            success: true,
            message: "Home hero section updated successfully",
            data: updatedHero,
        });
    } catch (error) {
        console.error("Home Hero Update Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update home hero section",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE HOME HERO
// =====================================================

export const deleteById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedHero =
            await HomePageHeroSectionModel.findByIdAndDelete(id);

        if (!deletedHero) {
            return res.status(404).json({
                success: false,
                message: "Home hero section not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Home hero section deleted successfully",
            data: deletedHero,
        });
    } catch (error) {
        console.error("Home Hero Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete home hero section",
            error: error.message,
        });
    }
};


// =====================================================
// UPDATE STATUS
// =====================================================

export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedHero =
            await HomePageHeroSectionModel.findByIdAndUpdate(
                id,
                {
                    status:
                        status === true ||
                        status === "true",
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!updatedHero) {
            return res.status(404).json({
                success: false,
                message: "Home hero section not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Home hero status updated successfully",
            data: updatedHero,
        });
    } catch (error) {
        console.error("Home Hero Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update home hero status",
            error: error.message,
        });
    }
};