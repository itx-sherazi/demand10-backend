import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Badge name is required"],
    trim: true,
    unique: true,
  },
  image: {
    type: String,
    required: [true, "Badge image URL is required"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
badgeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
badgeSchema.index({ name: 1 });
badgeSchema.index({ isActive: 1 });

const Badge = mongoose.models.Badge || mongoose.model("Badge", badgeSchema);
export default Badge;