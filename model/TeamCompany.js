import mongoose from "mongoose";

const teamLeadSchema = new mongoose.Schema(
  {
    name: { type: String, },
    facebookUrl: { type: String },
    linkedinUrl: { type: String },
    twitterUrl: { type: String },
    position: { type: String },
  },
  { _id: false }
);

const companyTeamSchema = new mongoose.Schema({
  companyName: { type: String,},
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory",
  },
  categoryName: { type: String },
  description:{type:String},
  employees: { type: mongoose.Schema.Types.Mixed },
  industries: [String],
  website: { type: String },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  linkedinUrl: { type: String },
  facebookUrl: { type: String },
  twitterUrl: { type: String },
  companyCountry: { type: String },
  foundedYear: { type: Number },
  image: { type: String },
  sponsor:{ type: Boolean, default: false },
  homepage:{ type: Boolean, default: false }, // Add homepage field
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteUser'
  },
  // Field to indicate if company was submitted through listing form
  submittedThroughListingForm: {
    type: Boolean,
    default: false
  },
  teamLeads: [teamLeadSchema],
});

const CompanyTeamData = mongoose.model("companyTeam", companyTeamSchema);
export default CompanyTeamData;