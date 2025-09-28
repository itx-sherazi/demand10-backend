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
  // Added new fields
  minimumProjectSize: {
    type: String  // Changed from Number to String to support ranges like "$1k - $5k"
  },
  hourlyRate: {
    type: String  // Changed from Number to String to support ranges like "$25 - $49"
  },
  // Service lines field
  services: [{
    serviceName: { type: String },
    category: { type: String},
    percentage: { type: Number, min: 10, max: 100 }
  }],
  
  // Focus areas field
  focus: [{
    focusName: { type: String },
    category: { type: String},
    percentage: { type: Number,  min: 10, max: 100 }
  }],

  // Industries field (for graph data)
  industries: [{
    industryName: { type: String },
    percentage: { type: Number, min: 10, max: 100 }
  }],

  // Industry tags field (simple string array)
  industryTags: [String],

  // Clients field
  clients: [{
    clientSegment: { type: String },
    percentage: { type: Number, min: 10, max: 100 }
  }],

}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

const CompanyTeamData = mongoose.model("companyTeam", companyTeamSchema);
export default CompanyTeamData;