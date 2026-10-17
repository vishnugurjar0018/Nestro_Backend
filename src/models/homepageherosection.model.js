import mongoose from "mongoose";

const homePageHeroSectionSchema = new mongoose.Schema(
    {
        eyebrow: {
            type: String,
            trim: true,
            default: "NEW COLLECTION — SS 2026",
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        highlightedTitle: {
            type: String,
            trim: true,
            default: "Collection",
        },

        description: {
            type: String,
            trim: true,
        },

        primaryButtonText: {
            type: String,
            trim: true,
            default: "Explore Collection",
        },

        primaryButtonLink: {
            type: String,
            trim: true,
            default: "/store",
        },

        secondaryButtonText: {
            type: String,
            trim: true,
            default: "View Lookbook",
        },

        secondaryButtonLink: {
            type: String,
            trim: true,
            default: "/lookbook",
        },

        image: {
            type: String,
            trim: true,
        },

        offerText: {
            type: String,
            trim: true,
        },

        offerPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        status: {
            type: Boolean,
            default: true,
        },

        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const HomePageHeroSectionModel = mongoose.model(
    "homePageHeroSection",
    homePageHeroSectionSchema
);

export default HomePageHeroSectionModel;