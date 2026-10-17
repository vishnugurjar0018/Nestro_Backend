import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
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
        type:String,
        
    },
    status: {
        type:Boolean,
        default:true
    }
    
},{
    timestamps:true

}
)

const CategoryModel=mongoose.model("catergory",categorySchema);
export default CategoryModel