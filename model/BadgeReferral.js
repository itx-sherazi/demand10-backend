import mongoose from "mongoose";

const badgeReferralSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "companyTeam",
    required: true,
  },
  sourceWebsite: {
    type: String,
    required: true,
  },
  referralCount: {
    type: Number,
    default: 1,
  },
  lastReferralAt: {
    type: Date,
    default: Date.now,
  },
  userAgent: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
badgeReferralSchema.index({ companyId: 1, sourceWebsite: 1 }, { unique: true });
badgeReferralSchema.index({ lastReferralAt: -1 });

const BadgeReferral = mongoose.models.BadgeReferral || mongoose.model("BadgeReferral", badgeReferralSchema);
export default BadgeReferral;