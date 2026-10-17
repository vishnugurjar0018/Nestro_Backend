import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import cloudinary from "../config/cloudinary.js";


const storage = new CloudinaryStorage({

    cloudinary: cloudinary,

    params: {
        folder: "website-content",

        allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "webp"
        ]
    }

});


const websiteContentUpload = multer({

    storage: storage,

    limits: {
        fileSize: 1 * 1024 * 1024
    }

});


export default websiteContentUpload;