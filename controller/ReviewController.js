import Review from "../model/Review.js";
import CompanyTeamData from "../model/TeamCompany.js";
import User from "../model/User.js";
import AdminModel from "../model/AdminUser.js";
import mongoose from "mongoose"; // Add mongoose import
// Replace the direct import of send-email with the new notification emails helper
import {
  sendNewReviewNotificationToAdmin,
  sendReviewSubmittedNotificationToUser,
  sendReviewApprovedNotificationToUser,
  sendReviewRejectedNotificationToUser,
  sendReviewDeletedNotificationToAdmin,
  sendReviewDeletedNotificationToUser
} from "../helpers/notification-emails.js";

// Search companies by name for the review search feature
export const searchCompanies = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        ok: false,
        message: "Query parameter is required"
      });
    }
    
    // Search companies by name (case insensitive)
    const companies = await CompanyTeamData.find({
      companyName: { $regex: query, $options: "i" }
    })
    .select("companyName image slug")
    .limit(10); // Limit to 10 suggestions
    
    return res.status(200).json({
      ok: true,
      companies
    });
  } catch (err) {
    console.error("Error searching companies:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Submit a new review
export const submitReview = async (req, res) => {
  const userId = req.user?.userId; // From auth middleware

  // Check if user is authenticated
  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "User not authenticated"
    });
  }

  try {
    const {
      companyId,
      companySlug,
      project,
      overallRating,
      ratings,
      reviewText,
      feedbackSummary,
      reviewer
    } = req.body;

    // Validate required fields
    if ((!companyId && !companySlug) || !overallRating || !reviewText || !reviewer || !reviewer.name || !project || !project.title || !project.type) {
      return res.status(400).json({
        ok: false,
        message: "Please fill in all required fields"
      });
    }

    // Check if company exists (by ID or slug)
    let company;
    if (companyId) {
      company = await CompanyTeamData.findById(companyId);
    } else if (companySlug) {
      company = await CompanyTeamData.findOne({ slug: companySlug });
    }

    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }

    // Use the company ID for consistency
    const companyIdToUse = company._id;

    // Check if user has already submitted a review for this company
    const existingReview = await Review.findOne({ user: userId, company: companyIdToUse });
    if (existingReview) {
      return res.status(400).json({
        ok: false,
        message: "You have already submitted a review for this company"
      });
    }

    // Create new review
    const newReview = new Review({
      user: userId,
      company: companyIdToUse,
      project,
      overallRating: parseInt(overallRating),
      ratings,
      reviewText,
      feedbackSummary,
      reviewer,
      status: "pending"
    });

    await newReview.save();

    // Populate company and user details for email
    await newReview.populate([
      { path: "company", select: "companyName" },
      { path: "user", select: "email" }
    ]);

    // Send email notification to admin
    if (newReview.company && newReview.company.companyName) {
      await sendNewReviewNotificationToAdmin(newReview.company.companyName);
    }

    // Send email notification to user (only if user email exists)
    if (newReview.user && newReview.user.email && newReview.company && newReview.company.companyName) {
      await sendReviewSubmittedNotificationToUser(newReview.user.email, newReview.company.companyName);
    }

    return res.status(201).json({
      ok: true,
      message: "Review submitted successfully",
      review: newReview
    });
  } catch (err) {
    console.error("Error submitting review:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get all reviews (for admin)
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "email")
      .populate("company", "companyName slug")
      .populate("approvedBy")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get user's reviews (for website users)
export const getUserReviews = async (req, res) => {
  const userId = req.user?.userId; // From auth middleware

  try {
    const reviews = await Review.find({ user: userId })
      .populate("company", "companyName slug image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get reviews for companies that the vendor has edit access to
export const getVendorCompanyReviews = async (req, res) => {
  const userId = req.user?.userId; // From auth middleware
  const { page = 1, limit = 10, companyId } = req.query;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "User not authenticated"
    });
  }

  try {
    let query = {};
    
    if (companyId) {
      // If specific company requested, check edit access
      const company = await CompanyTeamData.findById(companyId);
      
      if (!company) {
        return res.status(404).json({
          ok: false,
          message: "Company not found"
        });
      }
      
      // Check if user has edit access to this company
      const hasAccess = company.claimedBy && company.claimedBy.toString() === userId;
      
      if (!hasAccess) {
        return res.status(403).json({
          ok: false,
          message: "Access denied. You don't have edit rights to this company."
        });
      }
      
      query.company = companyId;
    } else {
      // Get the primary company the user has claimed
      // Priority: 1. Company submitted through listing form by this user, 2. First claimed company
      const userCompanies = await CompanyTeamData.find({
        claimedBy: userId
      }).select('_id submittedThroughListingForm claimedBy').sort({ createdAt: -1 });
      
      if (userCompanies.length === 0) {
        return res.status(200).json({
          ok: true,
          count: 0,
          reviews: [],
          totalCount: 0,
          currentPage: parseInt(page),
          totalPages: 0,
          message: "No companies found with edit access"
        });
      }
      
      // Find the primary company for this user
      // First priority: Companies submitted through listing form by this user
      let primaryCompany = userCompanies.find(comp => comp.submittedThroughListingForm);
      
      // Second priority: First claimed company (if no companies were submitted through listing)
      if (!primaryCompany) {
        primaryCompany = userCompanies[0];
      }
      
      if (!primaryCompany) {
        return res.status(200).json({
          ok: true,
          count: 0,
          reviews: [],
          totalCount: 0,
          currentPage: parseInt(page),
          totalPages: 0,
          message: "No companies found with edit access"
        });
      }
      
      // Query reviews only for the primary company
      query.company = primaryCompany._id;
    }

    // Only show approved reviews
    query.status = "approved";

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate("company", "companyName slug image")
      .populate("user", "email") // Limited user info for privacy
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Review.countDocuments(query);

    return res.status(200).json({
      ok: true,
      count: reviews.length,
      totalCount,
      reviews,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) {
    console.error("Error fetching vendor company reviews:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get reviews for a specific company (for public display)
export const getCompanyReviews = async (req, res) => {
  try {
    const { slug, companyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    let company;
    
    // Determine which parameter is being used
    if (companyId) {
      // Validate that companyId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid company ID format"
        });
      }
      company = await CompanyTeamData.findById(companyId);
    } else if (slug) {
      company = await CompanyTeamData.findOne({ slug });
    } else {
      return res.status(400).json({
        ok: false,
        message: "Company slug or ID is required"
      });
    }

    // Validate company exists
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }

    // Get reviews with pagination
    const reviews = await Review.find({ 
      company: company._id, 
      status: "approved" 
    })
    .populate("user", "email") // We might want to hide user details for privacy
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Review.countDocuments({ 
      company: company._id, 
      status: "approved" 
    });

    // Calculate average rating
    let averageRating = 0;
    if (totalCount > 0) {
      // Use aggregation to calculate average rating efficiently
      const ratingResult = await Review.aggregate([
        { $match: { company: company._id, status: "approved" } },
        { $group: { _id: null, average: { $avg: { $ifNull: ["$overallRating", "$rating"] } } } }
      ]);
      
      if (ratingResult.length > 0 && ratingResult[0].average) {
        averageRating = ratingResult[0].average;
      }
    }

    return res.status(200).json({
      ok: true,
      count: reviews.length,
      totalCount,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      reviews
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Approve a review (admin only)
export const approveReview = async (req, res) => {
  const { reviewId } = req.params;
  const adminUserId = req.user?.userId; // From auth middleware (admin)

  try {
    // Find the review
    const review = await Review.findById(reviewId).populate([
      { path: "company", select: "companyName" },
      { path: "user", select: "email" }
    ]);
    
    if (!review) {
      return res.status(404).json({
        ok: false,
        message: "Review not found"
      });
    }

    

    // Update review status (allow changing from any status to approved)
    const previousStatus = review.status;
    review.status = "approved";
    review.approvedBy = adminUserId;
    review.approvedAt = new Date();
    
    await review.save();

    // Send email notification to user (only if status changed and user email exists)
    if (previousStatus !== "approved" && review.user && review.user.email && review.company && review.company.companyName) {
      const result = await sendReviewApprovedNotificationToUser(review.user.email, review.company.companyName);
      if (result && !result.success) {
        console.error("Failed to send approval notification:", result.error);
      }
    } else {
      console.log("Skipping approval notification due to missing data:");
      console.log("User email:", review.user?.email);
      console.log("Company name:", review.company?.companyName);
    }

    return res.status(200).json({
      ok: true,
      message: "Review approved successfully",
      review
    });
  } catch (err) {
    console.error("Error approving review:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Reject a review (admin only)
export const rejectReview = async (req, res) => {
  const { reviewId } = req.params;
  const adminUserId = req.user?.userId; // From auth middleware (admin)

  try {
    // Find the review
    const review = await Review.findById(reviewId).populate([
      { path: "company", select: "companyName" },
      { path: "user", select: "email" }
    ]);
    
    if (!review) {
      return res.status(404).json({
        ok: false,
        message: "Review not found"
      });
    }

    

    

    // Update review status (allow changing from any status to rejected)
    const previousStatus = review.status;
    review.status = "rejected";
    review.approvedBy = adminUserId;
    review.approvedAt = new Date();
    
    await review.save();

    // Send email notification to user (only if status changed and user email exists)
    if (previousStatus !== "rejected" && review.user && review.user.email && review.company && review.company.companyName) {
      const result = await sendReviewRejectedNotificationToUser(review.user.email, review.company.companyName);
      if (result && !result.success) {
        console.error("Failed to send rejection notification:", result.error);
      }
    } else {
      console.log("Skipping rejection notification due to missing data:");

    }

    return res.status(200).json({
      ok: true,
      message: "Review rejected successfully",
      review
    });
  } catch (err) {
    console.error("Error rejecting review:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Delete a review (admin only)
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const adminUserId = req.user?.userId; // From auth middleware (admin)

  try {
    // Find the review
    const review = await Review.findById(reviewId).populate([
      { path: "company", select: "companyName" },
      { path: "user", select: "email" }
    ]);
    
    if (!review) {
      return res.status(404).json({
        ok: false,
        message: "Review not found"
      });
    }

    // Store review details for response before deletion
    const reviewDetails = {
      id: review._id,
      company: review.company ? review.company.companyName : 'Unknown Company',
      status: review.status
    };

    // Delete the review from database
    await Review.findByIdAndDelete(reviewId);

    // Send confirmation email to admin
    if (review.company && review.company.companyName) {
      await sendReviewDeletedNotificationToAdmin(review.company.companyName, review._id, review.status);
    }

    // Send notification email to user (if user email exists)
    if (review.user && review.user.email && review.company && review.company.companyName) {
      await sendReviewDeletedNotificationToUser(review.user.email, review.company.companyName);
    }

    return res.status(200).json({
      ok: true,
      message: "Review deleted successfully",
      deletedReview: reviewDetails
    });
  } catch (err) {
    console.error("Error deleting review:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get company details with average rating
export const getCompanyWithRating = async (req, res) => {
  try {
    const { slug, companyId } = req.params;

    let company;
    
    // Determine which parameter is being used
    if (companyId) {
      // Validate that companyId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid company ID format"
        });
      }
      company = await CompanyTeamData.findById(companyId);
    } else if (slug) {
      company = await CompanyTeamData.findOne({ slug });
    } else {
      return res.status(400).json({
        ok: false,
        message: "Company slug or ID is required"
      });
    }

    // Validate company exists
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }

    // Calculate average rating
    const reviews = await Review.find({ 
      company: company._id, 
      status: "approved" 
    });

    let averageRating = 0;
    let totalReviews = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + (review.overallRating || review.rating || 0), 0);
      averageRating = totalRating / reviews.length;
      totalReviews = reviews.length;
    }

    return res.status(200).json({
      ok: true,
      company: {
        ...company.toObject(),
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: totalReviews
      }
    });
  } catch (err) {
    console.error("Error in getCompanyWithRating:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};