import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true

    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    shortDescription: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },

    categoryID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "catergory",
        required: true

    },

    roomID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "room",
        required: true

    },

    price: {
        type: Number,
        required: true,
        min: 200

    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    stock: {
        type: Boolean,
        default: true,
        required: true
    },

    thumbnail: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: []
    },

    material: {
        type: String,
        enum: [

            "Wood",
            "Sheesham",
            "Engineered Wood",
            "Metal",
            "Steel",
            "Plastic",
            "Glass",
            "Marble",
            "Fabric",
            "Leather"
        ],
        default: "Wood"
    },
    color: {
        type: String
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            default: "cm"
        }

    },
    weight: {
        value: Number,
        unit: {
            type: String,
            default: "kg"
        }

    },

    featured: {
        type: Boolean,
        default: false
    },
    newArrival: {
        type: Boolean,
        default: false
    },

    status: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true

}
)

const ProductModel = mongoose.model("product", productSchema);
export default ProductModel