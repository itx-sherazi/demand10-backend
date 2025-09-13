import Badge from "../model/Badge.js";
import CompanyBadge from "../model/CompanyBadge.js";
import CompanyTeamData from "../model/TeamCompany.js";
import fs from "fs";
import path from "path";
import { clearCompaniesCache } from "../Router/ClearCache.js"; // Import cache clearing function

// Create badges directory if it doesn't exist
const badgesDir = path.join(process.cwd(), "uploads", "badges");
const publicBadgesDir = path.join(process.cwd(), "public", "badges");

if (!fs.existsSync(badgesDir)) {
  fs.mkdirSync(badgesDir, { recursive: true });
}

if (!fs.existsSync(publicBadgesDir)) {
  fs.mkdirSync(publicBadgesDir, { recursive: true });
}

// Utility function to move file from uploads to public directory
const moveBadgeToPublic = (tempPath, filename) => {
  const publicPath = path.join(publicBadgesDir, filename);
  fs.renameSync(tempPath, publicPath);
  return `/badges/${filename}`;
};

// Utility function to construct full image URL
const getFullImageUrl = (imagePath, req) => {
  // If it's already a full URL, return it as is
  if (!imagePath) return "";
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Handle reverse proxy scenarios
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  
  // Construct full URL using request information
  return `${protocol}://${host}${imagePath}`;
};

// Create a new badge
export const createBadge = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Badge name is required" });
    }

    let imageUrl = "";

    // Handle badge image upload
    if (req.file) {
      // Move file from uploads to public directory
      imageUrl = moveBadgeToPublic(req.file.path, req.file.filename);
    }

    // Create badge
    const badge = new Badge({
      name,
      image: imageUrl,
    });

    await badge.save();

    // Return badge with full image URL
    const badgeWithFullUrl = {
      ...badge.toObject(),
      image: getFullImageUrl(imageUrl, req)
    };

    res.status(201).json({
      success: true,
      message: "Badge created successfully",
      data: badgeWithFullUrl,
    });
  } catch (error) {
    console.error("Error creating badge:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all badges
export const getAllBadges = async (req, res) => {
  try {
    const { isActive } = req.query;
    let filter = {};

    if (isActive !== undefined) filter.isActive = isActive === "true";

    const badges = await Badge.find(filter).sort({ createdAt: -1 });
    
    // Return badges with full image URLs
    const badgesWithFullUrls = badges.map(badge => ({
      ...badge.toObject(),
      image: getFullImageUrl(badge.image, req)
    }));
    
    res.status(200).json({
      success: true,
      data: badgesWithFullUrls,
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get badge by ID
export const getBadgeById = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }
    
    // Return badge with full image URL
    const badgeWithFullUrl = {
      ...badge.toObject(),
      image: getFullImageUrl(badge.image, req)
    };
    
    res.status(200).json({
      success: true,
      data: badgeWithFullUrl,
    });
  } catch (error) {
    console.error("Error fetching badge:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update badge
export const updateBadge = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    // Update badge fields
    if (name) badge.name = name;
    if (isActive !== undefined) badge.isActive = isActive === "true" || isActive === true;

    // Handle badge image upload if provided
    if (req.file) {
      // Delete old image file if it exists
      if (badge.image) {
        const oldImagePath = path.join(process.cwd(), "public", badge.image.substring(1)); // Remove leading slash
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Move new file from uploads to public directory
      const newImagePath = moveBadgeToPublic(req.file.path, req.file.filename);
      badge.image = newImagePath;
    }

    await badge.save();

    // Return badge with full image URL
    const badgeWithFullUrl = {
      ...badge.toObject(),
      image: getFullImageUrl(badge.image, req)
    };

    res.status(200).json({
      success: true,
      message: "Badge updated successfully",
      data: badgeWithFullUrl,
    });
  } catch (error) {
    console.error("Error updating badge:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete badge
export const deleteBadge = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    // Delete badge image file if it exists
    if (badge.image) {
      const imagePath = path.join(process.cwd(), "public", badge.image.substring(1)); // Remove leading slash
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Also remove all company associations with this badge
    await CompanyBadge.deleteMany({ badge: req.params.id });

    await Badge.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Badge deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting badge:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update company's homepage status for an existing badge assignment
export const updateCompanyBadgeHomepage = async (req, res) => {
  try {
    const { companyId, badgeId, homepage } = req.body;
    
    if (!companyId || !badgeId || homepage === undefined) {
      return res.status(400).json({ message: "Company ID, Badge ID, and homepage status are required" });
    }

    // Check if company exists
    const company = await CompanyTeamData.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if badge exists
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    // Check if company already has this badge
    const existingAssignment = await CompanyBadge.findOne({
      company: companyId,
      badge: badgeId,
    });

    // If badge is not assigned to company, return error
    if (!existingAssignment) {
      return res.status(404).json({ message: "Company does not have this badge assigned" });
    }

    // Update company's homepage status
    company.homepage = homepage;
    await company.save();
    
    // Clear companies cache to ensure the updated homepage status is reflected
    try {
      await clearCompaniesCache();
      console.log("Companies cache cleared after homepage status update");
    } catch (cacheError) {
      console.error("Error clearing companies cache:", cacheError);
    }

    res.status(200).json({
      success: true,
      message: "Company homepage status updated successfully",
      data: {
        company: {
          id: company._id,
          companyName: company.companyName,
          homepage: company.homepage
        },
        badge: {
          id: badge._id,
          name: badge.name
        }
      },
    });
  } catch (error) {
    console.error("Error updating company badge homepage status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Assign badge to company
export const assignBadgeToCompany = async (req, res) => {
  try {
    const { companyId, badgeId, expiresAt, customData, homepage } = req.body;
    
    if (!companyId || !badgeId) {
      return res.status(400).json({ message: "Company ID and Badge ID are required" });
    }

    // Check if company exists
    const company = await CompanyTeamData.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if badge exists
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    // Check if company already has this badge
    const existingAssignment = await CompanyBadge.findOne({
      company: companyId,
      badge: badgeId,
    });

    if (existingAssignment) {
      return res.status(400).json({ message: "Company already has this badge assigned" });
    }

    // Create company-badge association
    const companyBadge = new CompanyBadge({
      company: companyId,
      badge: badgeId,
      assignedBy: req.user.userId, // Use req.user.userId instead of req.adminUser._id
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      customData: customData || {},
    });

    await companyBadge.save();

    // Update company's homepage status if specified
    if (homepage !== undefined) {
      company.homepage = homepage;
      await company.save();
      
      // Clear companies cache to ensure the updated homepage status is reflected
      try {
        await clearCompaniesCache();
        console.log("Companies cache cleared after homepage status update");
      } catch (cacheError) {
        console.error("Error clearing companies cache:", cacheError);
      }
    }

    // Populate references
    await companyBadge.populate([
      { path: 'company', select: 'companyName slug' },
      { path: 'badge', select: 'name image' }
    ]);

    // Return company badge with full image URL
    const populatedCompanyBadge = companyBadge.toObject();
    if (populatedCompanyBadge.badge && populatedCompanyBadge.badge.image) {
      populatedCompanyBadge.badge.image = getFullImageUrl(populatedCompanyBadge.badge.image, req);
    }

    res.status(201).json({
      success: true,
      message: "Badge assigned to company successfully",
      data: populatedCompanyBadge,
    });
  } catch (error) {
    console.error("Error assigning badge to company:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove badge from company
export const removeBadgeFromCompany = async (req, res) => {
  try {
    const companyBadge = await CompanyBadge.findByIdAndDelete(req.params.id);
    
    if (!companyBadge) {
      return res.status(404).json({ message: "Company badge assignment not found" });
    }

    res.status(200).json({
      success: true,
      message: "Badge removed from company successfully",
    });
  } catch (error) {
    console.error("Error removing badge from company:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update company badge assignment
export const updateCompanyBadge = async (req, res) => {
  try {
    const { isActive, expiresAt, customData } = req.body;
    
    const companyBadge = await CompanyBadge.findById(req.params.id);
    
    if (!companyBadge) {
      return res.status(404).json({ message: "Company badge assignment not found" });
    }

    if (isActive !== undefined) companyBadge.isActive = isActive === "true" || isActive === true;
    if (expiresAt !== undefined) companyBadge.expiresAt = new Date(expiresAt);
    if (customData !== undefined) companyBadge.customData = customData;

    await companyBadge.save();

    // Populate references
    await companyBadge.populate([
      { path: 'company', select: 'companyName slug' },
      { path: 'badge', select: 'name image' }
    ]);

    // Return company badge with full image URL
    const populatedCompanyBadge = companyBadge.toObject();
    if (populatedCompanyBadge.badge && populatedCompanyBadge.badge.image) {
      populatedCompanyBadge.badge.image = getFullImageUrl(populatedCompanyBadge.badge.image, req);
    }

    res.status(200).json({
      success: true,
      message: "Company badge assignment updated successfully",
      data: populatedCompanyBadge,
    });
  } catch (error) {
    console.error("Error updating company badge assignment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get badges for a specific company (admin)
export const getCompanyBadges = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { isActive } = req.query;
    
    let filter = { company: companyId };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const companyBadges = await CompanyBadge.find(filter)
      .populate("badge")
      .sort({ assignedAt: -1 });
    
    // Return company badges with full image URLs
    const companyBadgesWithFullUrls = companyBadges.map(companyBadge => {
      const populatedCompanyBadge = companyBadge.toObject();
      if (populatedCompanyBadge.badge && populatedCompanyBadge.badge.image) {
        populatedCompanyBadge.badge.image = getFullImageUrl(populatedCompanyBadge.badge.image, req);
      }
      return populatedCompanyBadge;
    });
    
    res.status(200).json({
      success: true,
      data: companyBadgesWithFullUrls,
    });
  } catch (error) {
    console.error("Error fetching company badges:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get badges for a specific company (public/frontend)
export const getCompanyBadgesForFrontend = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Get current date for expiration check
    const now = new Date();
    
    const companyBadges = await CompanyBadge.find({
      company: companyId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    })
    .populate("badge", "name image updatedAt")
    .sort({ assignedAt: -1 });
    
    // Return company badges with full image URLs
    const companyBadgesWithFullUrls = companyBadges.map(companyBadge => {
      const populatedCompanyBadge = companyBadge.toObject();
      if (populatedCompanyBadge.badge && populatedCompanyBadge.badge.image) {
        // Use the getFullImageUrl utility function to construct full URLs
        populatedCompanyBadge.badge.image = getFullImageUrl(populatedCompanyBadge.badge.image, req);
      }
      return populatedCompanyBadge;
    });
    
    res.status(200).json({
      success: true,
      data: companyBadgesWithFullUrls,
    });
  } catch (error) {
    console.error("Error fetching company badges for frontend:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all company badge assignments
export const getAllCompanyBadges = async (req, res) => {
  try {
    const { companyId, badgeId, isActive } = req.query;
    let filter = {};

    if (companyId) filter.company = companyId;
    if (badgeId) filter.badge = badgeId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const companyBadges = await CompanyBadge.find(filter)
      .populate("company", "companyName slug")
      .populate("badge")
      .sort({ assignedAt: -1 });
    
    // Return company badges with full image URLs
    const companyBadgesWithFullUrls = companyBadges.map(companyBadge => {
      const populatedCompanyBadge = companyBadge.toObject();
      if (populatedCompanyBadge.badge && populatedCompanyBadge.badge.image) {
        populatedCompanyBadge.badge.image = getFullImageUrl(populatedCompanyBadge.badge.image, req);
      }
      return populatedCompanyBadge;
    });
    
    res.status(200).json({
      success: true,
      data: companyBadgesWithFullUrls,
    });
  } catch (error) {
    console.error("Error fetching company badges:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};