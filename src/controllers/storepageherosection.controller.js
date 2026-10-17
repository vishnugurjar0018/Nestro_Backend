import mongoose from "mongoose";

import StorePageHeroSectionModel from "../models/storepageherosection.model.js";

import {
    successResponse,
    createdResponse,
    badResponse
} from "../utils/response.js";


// =====================================================
// READ ALL HERO SECTIONS
// =====================================================

export const readAll = async (req, res) => {
    try {

        const heroSections =
            await StorePageHeroSectionModel
                .find()
                .sort({
                    sortOrder: 1,
                    createdAt: -1
                });

        return successResponse(
            res,
            "Store page hero sections fetched successfully",
            heroSections
        );

    } catch (error) {

        console.log(
            "STORE HERO READ ALL ERROR:",
            error
        );

        return errorResponse(
            res,
            "Failed to fetch store page hero sections"
        );
    }
};


// =====================================================
// READ HERO SECTION BY ID
// =====================================================

export const readById = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {

            return badResponse(
                res,
                "Invalid hero section ID"
            );
        }


        const heroSection =
            await StorePageHeroSectionModel.findById(id);


        if (!heroSection) {

            return badResponse(
                res,
                "Store page hero section not found"
            );
        }


        return successResponse(
            res,
            "Store page hero section fetched successfully",
            heroSection
        );

    } catch (error) {

        console.log(
            "STORE HERO READ BY ID ERROR:",
            error
        );

        return errorResponse(
            res,
            "Failed to fetch store page hero section"
        );
    }
};


// =====================================================
// CREATE HERO SECTION
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
            sortOrder
        } = req.body;


        // -------------------------------------------------
        // REQUIRED VALIDATION
        // -------------------------------------------------

        if (!title || !title.trim()) {

            return badResponse(
                res,
                "Hero title is required"
            );
        }


        // -------------------------------------------------
        // CHECK EXISTING HERO
        // -------------------------------------------------

        const existingHero =
            await StorePageHeroSectionModel.findOne();


        if (existingHero) {

            return badResponse(
                res,
                "Store page hero section already exists"
            );
        }


        // -------------------------------------------------
        // IMAGE
        // -------------------------------------------------

        const image =
            req.file?.path || "";


        // -------------------------------------------------
        // CREATE HERO
        // -------------------------------------------------

        const heroSection =
            await StorePageHeroSectionModel.create({

                eyebrow:
                    eyebrow?.trim() ||
                    "SUMMER COLLECTION 2026",

                title:
                    title.trim(),

                highlightedTitle:
                    highlightedTitle?.trim() ||
                    "Craft",

                description:
                    description?.trim() || "",

                primaryButtonText:
                    primaryButtonText?.trim() ||
                    "Explore Collection",

                primaryButtonLink:
                    primaryButtonLink?.trim() ||
                    "/store",

                secondaryButtonText:
                    secondaryButtonText?.trim() ||
                    "View Lookbook",

                secondaryButtonLink:
                    secondaryButtonLink?.trim() ||
                    "/lookbook",

                image,

                offerText:
                    offerText?.trim() || "",

                offerPercentage:
                    offerPercentage !== undefined &&
                    offerPercentage !== ""
                        ? Number(offerPercentage)
                        : 0,

                status:
                    status !== undefined
                        ? String(status) === "true"
                        : true,

                sortOrder:
                    sortOrder !== undefined &&
                    sortOrder !== ""
                        ? Number(sortOrder)
                        : 0
            });


        return createdResponse(
            res,
            "Store page hero section created successfully",
            heroSection
        );

    } catch (error) {

        console.log(
            "STORE HERO CREATE ERROR:",
            error
        );


        if (error.code === 11000) {

            return badResponse(
                res,
                "Store page hero section already exists"
            );
        }


        return errorResponse(
            res,
            "Failed to create store page hero section"
        );
    }
};


// =====================================================
// UPDATE HERO SECTION
// =====================================================

export const update = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {

            return badResponse(
                res,
                "Invalid hero section ID"
            );
        }


        const heroSection =
            await StorePageHeroSectionModel.findById(id);


        if (!heroSection) {

            return badResponse(
                res,
                "Store page hero section not found"
            );
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
            sortOrder
        } = req.body;


        // -------------------------------------------------
        // UPDATE TEXT FIELDS
        // -------------------------------------------------

        if (eyebrow !== undefined) {
            heroSection.eyebrow =
                eyebrow.trim();
        }


        if (title !== undefined) {

            if (!title.trim()) {

                return badResponse(
                    res,
                    "Hero title cannot be empty"
                );
            }

            heroSection.title =
                title.trim();
        }


        if (highlightedTitle !== undefined) {

            heroSection.highlightedTitle =
                highlightedTitle.trim();
        }


        if (description !== undefined) {

            heroSection.description =
                description.trim();
        }


        // -------------------------------------------------
        // PRIMARY BUTTON
        // -------------------------------------------------

        if (primaryButtonText !== undefined) {

            heroSection.primaryButtonText =
                primaryButtonText.trim();
        }


        if (primaryButtonLink !== undefined) {

            heroSection.primaryButtonLink =
                primaryButtonLink.trim();
        }


        // -------------------------------------------------
        // SECONDARY BUTTON
        // -------------------------------------------------

        if (secondaryButtonText !== undefined) {

            heroSection.secondaryButtonText =
                secondaryButtonText.trim();
        }


        if (secondaryButtonLink !== undefined) {

            heroSection.secondaryButtonLink =
                secondaryButtonLink.trim();
        }


        // -------------------------------------------------
        // OFFER
        // -------------------------------------------------

        if (offerText !== undefined) {

            heroSection.offerText =
                offerText.trim();
        }


        if (
            offerPercentage !== undefined &&
            offerPercentage !== ""
        ) {

            heroSection.offerPercentage =
                Number(offerPercentage);
        }


        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        if (status !== undefined) {

            heroSection.status =
                String(status) === "true";
        }


        // -------------------------------------------------
        // SORT ORDER
        // -------------------------------------------------

        if (
            sortOrder !== undefined &&
            sortOrder !== ""
        ) {

            heroSection.sortOrder =
                Number(sortOrder);
        }


        // -------------------------------------------------
        // NEW IMAGE
        // -------------------------------------------------

        if (req.file) {

            heroSection.image =
                req.file.path;
        }


        await heroSection.save();


        return successResponse(
            res,
            "Store page hero section updated successfully",
            heroSection
        );

    } catch (error) {

        console.log(
            "STORE HERO UPDATE ERROR:",
            error
        );


        return errorResponse(
            res,
            "Failed to update store page hero section"
        );
    }
};


// =====================================================
// DELETE HERO SECTION
// =====================================================

export const deleteById = async (req, res) => {
    try {

        const { id } = req.params;


        if (!mongoose.Types.ObjectId.isValid(id)) {

            return badResponse(
                res,
                "Invalid hero section ID"
            );
        }


        const heroSection =
            await StorePageHeroSectionModel.findById(id);


        if (!heroSection) {

            return badResponse(
                res,
                "Store page hero section not found"
            );
        }


        await StorePageHeroSectionModel
            .findByIdAndDelete(id);


        return successResponse(
            res,
            "Store page hero section deleted successfully"
        );

    } catch (error) {

        console.log(
            "STORE HERO DELETE ERROR:",
            error
        );

        return errorResponse(
            res,
            "Failed to delete store page hero section"
        );
    }
};


// =====================================================
// UPDATE STATUS
// =====================================================

export const updateStatus = async (req, res) => {
    try {

        const { id } = req.params;

        const { status } = req.body;


        if (!mongoose.Types.ObjectId.isValid(id)) {

            return badResponse(
                res,
                "Invalid hero section ID"
            );
        }


        if (status === undefined) {

            return badResponse(
                res,
                "Status is required"
            );
        }


        const heroSection =
            await StorePageHeroSectionModel.findById(id);


        if (!heroSection) {

            return badResponse(
                res,
                "Store page hero section not found"
            );
        }


        heroSection.status =
            String(status) === "true";


        await heroSection.save();


        return successResponse(
            res,
            "Hero section status updated successfully",
            heroSection
        );

    } catch (error) {

        console.log(
            "STORE HERO STATUS ERROR:",
            error
        );

        return errorResponse(
            res,
            "Failed to update hero section status"
        );
    }
};