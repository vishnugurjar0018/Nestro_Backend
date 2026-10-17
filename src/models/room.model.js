import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            maxLength: 30,
            minLength: 3,
            unique: true
        },

        slug: {
            type: String,
            required: true,
            unique: true
        },

        image: {
            type: String
        },

        status: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const RoomModel = mongoose.model("room", roomSchema);

export default RoomModel;