import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  slug: {
    type: String,
    unique: true,
  },
  subcategories: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory", // Ensure "Subcategory" matches exactly the name of your Subcategory model
  }
],

});

const Category = mongoose.model("Category", categorySchema);
export default Category;
