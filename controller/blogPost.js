import Post from "../model/Post.js";

export const createPost = async (req, res) => {
  try {
    const { title, body, description, tags, category, metaTitle, metaDescription, keywords } = req.body;
    const image = req.file?.path || req.file?.secure_url;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    // Process tags and keywords as arrays
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => tag && tag.trim() !== "");
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
      }
    }

    let processedKeywords = [];
    if (keywords) {
      if (Array.isArray(keywords)) {
        processedKeywords = keywords.filter(keyword => keyword && keyword.trim() !== "");
      } else if (typeof keywords === 'string') {
        processedKeywords = keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword !== "");
      }
    }

    // Let the model's pre-save hook handle slug generation
    const post = await Post.create({
      title,
      description,
      body,
      image,
      tags: processedTags,
      category: category || "General",
      metaTitle,
      metaDescription,
      keywords: processedKeywords,
    });

    res.status(200).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllPostsSitemap = async (req, res) => {
  try {

    // fetch only the needed fields for sitemap
    const posts = await Post.find()
      .select("slug createdAt")   // only keep lightweight fields
      .sort({ createdAt: -1 })    // latest first
      .lean();

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No posts found for sitemap",
      });
    }
    
    // Add date field that maps to createdAt for frontend compatibility
    const postsWithDate = posts.map(post => ({
      ...post,
      date: post.createdAt
    }));

    res.status(200).json({
      success: true,
      data: postsWithDate,
      total: postsWithDate.length,
    });
  } catch (error) {
    console.error("Sitemap Posts Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching posts for sitemap",
      error: error.message,
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // current page
    const limit = 10; // posts per page
    const skip = (page - 1) * limit;

    // Count total posts for pagination
    const totalPosts = await Post.countDocuments();

    // Fetch posts with pagination & latest first
    const posts = await Post.find()
    .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Add date field that maps to createdAt for frontend compatibility
    const postsWithDate = posts.map(post => ({
      ...post,
      date: post.createdAt
    }));

    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: postsWithDate,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getLatestPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // latest first
      .limit(6);
    
    // Add date field that maps to createdAt for frontend compatibility
    const postsWithDate = posts.map(post => ({
      ...post.toObject(),
      date: post.createdAt
    }));

    res.status(200).json({
      success: true,
      message: "Latest posts fetched successfully",
      data: postsWithDate,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }); 
    if (!post) {
      return res.status(404).json({ ok: false, message: "Post not found" });
    }
    
    // Add date field that maps to createdAt for frontend compatibility
    const postWithDate = {
      ...post.toObject(),
      date: post.createdAt
    };
    
    res.status(200).json({ ok: true, data: postWithDate });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: "Server error", error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};