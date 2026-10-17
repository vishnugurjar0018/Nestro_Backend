import mongoose from "mongoose";

const storePageHeroSectionSchema = new mongoose.Schema(
    {
        // Small text above main heading
        eyebrow: {
            type: String,
            trim: true,
            default: "SUMMER COLLECTION 2026"
        },

        // Main heading
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Highlighted / italic part of heading
        highlightedTitle: {
            type: String,
            trim: true,
            default: "Craft"
        },

        // Hero description
        description: {
            type: String,
            trim: true
        },

        // Primary button
        primaryButtonText: {
            type: String,
            trim: true,
            default: "Explore Collection"
        },

        primaryButtonLink: {
            type: String,
            trim: true,
            default: "/store"
        },

        // Secondary button
        secondaryButtonText: {
            type: String,
            trim: true,
            default: "View Lookbook"
        },

        secondaryButtonLink: {
            type: String,
            trim: true,
            default: "/lookbook"
        },

        // Hero image
        image: {
            type: String,
            trim: true
        },

        // Optional offer
        offerText: {
            type: String,
            trim: true
        },

        offerPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        // Active / inactive
        status: {
            type: Boolean,
            default: true
        },

        // Display order
        sortOrder: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const StorePageHeroSectionModel = mongoose.model(
    "storePageHeroSection",
    storePageHeroSectionSchema
);

export default StorePageHeroSectionModel;