import mongoose from "mongoose";

const companyBadgeSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "companyTeam",
    required: true,
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Badge",
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminUser",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  customData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Expiration date for time-limited badges
  expiresAt: {
    type: Date,
  },
});

// Ensure a company can only have one instance of each badge
companyBadgeSchema.index({ company: 1, badge: 1 }, { unique: true });
companyBadgeSchema.index({ expiresAt: 1 });

const CompanyBadge = mongoose.models.CompanyBadge || mongoose.model("CompanyBadge", companyBadgeSchema);
export default CompanyBadge;