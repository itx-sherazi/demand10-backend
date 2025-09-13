import mongoose from "mongoose";



const dataSetRequest = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String},
  phone: { type: Number}, // Array if multiple industries
  contactCount: { type: Number },
  price: { type: Number },
  message: { type: String },
  productTitle:{type: String},
  categoryName:{type: String}


}, { timestamps: true }); // Add timestamps option to automatically add createdAt and updatedAt fields

const RequestData = mongoose.model("DatasetRequest", dataSetRequest);
export default RequestData;