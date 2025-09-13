import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  body: {
    type: String,
    required: [true, "Please add content"],
    trim: true,
  },
  description: {
    type: String,
    maxlength: 160,
  },
  image: {
    type: String,
    required: true,
  },
  tags: [String],
  category: {
    type: String,
    default: "General",
    index: true,
  },
  metaTitle: {
    type: String,
    maxlength: 60,
  },
  metaDescription: {
    type: String,
    maxlength: 160,
  },
  keywords: [String],
}, { timestamps: true });

// Add indexes for better query performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });

// 🔹 Pre-save hook for slug generation
PostSchema.pre("save", function(next) {
  if (!this.slug && this.title) {
    // Use a more robust slug generation
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
  }
  next();
});

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
export default Post;