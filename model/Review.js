import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  // Reviewer user (from your system)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WebsiteUser",
    required: true,
  },

  // Company being reviewed
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "companyTeam",
    required: true,
  },

  // -------------------------
  // PROJECT DETAILS
  // -------------------------
  project: {
    title: { type: String, required: true }, // e.g., "Web Development for Management Consulting Firm"
    type: { type: String, required: true },  // e.g., "Web Development"
    budget: { type: String },                // e.g., "$200,000 to $999,999"
    duration: { type: String },              // e.g., "Sep. 2021 - Aug. 2022"
    summary: { type: String },               // project summary text
  },

  // -------------------------
  // REVIEW DETAILS
  // -------------------------
  overallRating: { type: Number, min: 1, max: 5, required: true }, // e.g., 5.0
  ratings: {
    quality: { type: Number, min: 1, max: 5 },
    schedule: { type: Number, min: 1, max: 5 },
    cost: { type: Number, min: 1, max: 5 },
    willingToRefer: { type: Number, min: 1, max: 5 },
  },
  reviewText: { type: String, required: true },     // main review
  feedbackSummary: { type: String },               // feedback summary
  reviewDate: { type: Date, default: Date.now },   // review posted date

  // -------------------------
  // REVIEWER INFO
  // -------------------------
  reviewer: {
    name: { type: String, required: true },        // Claude Collavoli
    designation: { type: String },                 // Engagement Manager
    companyName: { type: String },                 // Solutia SDO
    industry: { type: String },                    // Business services
    location: { type: String },                    // Toronto, Ontario
    employees: { type: String },                   // 51-200 Employees
    interviewMethod: { type: String },             // Phone Interview
    verified: { type: Boolean, default: false },   // Verified true/false
  },

  // -------------------------
  // STATUS + META
  // -------------------------
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
reviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Review", reviewSchema);