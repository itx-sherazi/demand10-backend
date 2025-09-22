import CompanyListingRequest from "../model/CompanyListingRequest.js";
import Category from "../model/Category.js";
import Subcategory from "../model/Subcategory.js";
import CompanyTeamData from "../model/TeamCompany.js";

import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Readable } from "stream";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Import the new notification emails helper
import {
  sendNewCompanyListingNotificationToAdmin,
  sendCompanyListingSubmittedNotificationToUser,
  sendCompanyListingApprovedNotificationToUser,
  sendCompanyListingRejectedNotificationToUser
} from "../helpers/notification-emails.js";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file with explicit path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



// Multer configuration for file upload
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = (buffer, folder = "company-listings") => {
  return new Promise((resolve, reject) => {
   
    
    // Check if Cloudinary is properly configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      reject(new Error("Cloudinary configuration is missing. Please check your environment variables."));
      return;
    }
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log("Cloudinary upload successful:", result.secure_url);
          resolve(result.secure_url);
        }
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

// Submit a company listing request
export const submitCompanyListing = async (req, res) => {
  const userId = req.user?.userId; // From auth middleware

  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      website,
      description,
      companyCountry,
      foundedYear,
      employees,
      linkedinUrl,
      facebookUrl,
      twitterUrl,
      categoryId,
      subcategoryId,
      teamLeads,
      minimumProjectSize,
      hourlyRate,
      services,
      focus,
      industries,
      industryTags,
      clients // Add clients data
    } = req.body;

    // Validate required fields
    if (!companyName || !companyEmail || !companyPhone || !categoryId || !subcategoryId) {
      return res.status(400).json({
        ok: false,
        message: "Please fill in all required fields"
      });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        ok: false,
        message: "Category not found"
      });
    }

    // Check if subcategory exists and belongs to the category
    const subcategory = await Subcategory.findById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({
        ok: false,
        message: "Subcategory not found"
      });
    }

    if (subcategory.category.toString() !== categoryId) {
      return res.status(400).json({
        ok: false,
        message: "Subcategory does not belong to the selected category"
      });
    }

    // Handle image upload if provided
    let imageUrl = "";
    if (req.file) {
      try {
        imageUrl = await uploadImageToCloudinary(req.file.buffer);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        // If image upload fails, we'll still proceed with the request but without the image
        // This ensures users can still submit their listing even if image upload fails
      }
    } else {
      console.log("No image file received in request");
    }

    // Parse team leads if provided
    let parsedTeamLeads = [];
    if (teamLeads) {
      try {
        parsedTeamLeads = JSON.parse(teamLeads);
      } catch (parseError) {
        console.error("Team leads parse error:", parseError);
      }
    }

    // Parse services if provided
    let parsedServices = [];
    if (services) {
      try {
        parsedServices = JSON.parse(services);
        // Validate services: each service must be ≥10% and total cannot exceed 100%
        let totalPercentage = 0;
        for (const service of parsedServices) {
          if (service.percentage < 10) {
            return res.status(400).json({
              ok: false,
              message: "Each service must be at least 10%"
            });
          }
          totalPercentage += service.percentage;
        }
        if (totalPercentage > 100) {
          return res.status(400).json({
            ok: false,
            message: "Total percentage cannot exceed 100%"
          });
        }
      } catch (parseError) {
        console.error("Services parse error:", parseError);
      }
    }

    // Parse focus if provided
    let parsedFocus = [];
    if (focus) {
      try {
        parsedFocus = JSON.parse(focus);
        // Validate focus: each focus must be ≥10% and total cannot exceed 100%
        let totalPercentage = 0;
        for (const focusItem of parsedFocus) {
          if (focusItem.percentage < 10) {
            return res.status(400).json({
              ok: false,
              message: "Each focus area must be at least 10%"
            });
          }
          totalPercentage += focusItem.percentage;
        }
        if (totalPercentage > 100) {
          return res.status(400).json({
            ok: false,
            message: "Total focus percentage cannot exceed 100%"
          });
        }
      } catch (parseError) {
        console.error("Focus parse error:", parseError);
      }
    }

    // Parse industries for chart data if provided
    let parsedIndustries = [];
    if (industries) {
      try {
        parsedIndustries = JSON.parse(industries);
        // Validate industries: each industry must be ≥10% and total cannot exceed 100%
        let totalPercentage = 0;
        for (const industry of parsedIndustries) {
          if (industry.percentage < 10) {
            return res.status(400).json({
              ok: false,
              message: "Each industry must be at least 10%"
            });
          }
          totalPercentage += industry.percentage;
        }
        if (totalPercentage > 100) {
          return res.status(400).json({
            ok: false,
            message: "Total industry percentage cannot exceed 100%"
          });
        }
      } catch (parseError) {
        console.error("Industries parse error:", parseError);
      }
    }

    // Parse industry tags if provided
    let parsedIndustryTags = [];
    if (industryTags) {
      try {
        parsedIndustryTags = JSON.parse(industryTags);
      } catch (parseError) {
        // If JSON parsing fails, treat as comma-separated string
        parsedIndustryTags = industryTags.toString().split(',').map(tag => tag.trim());
      }
    }

    // Parse clients if provided
    let parsedClients = [];
    if (clients) {
      try {
        parsedClients = JSON.parse(clients);
        // Validate clients: each client must be ≥10% and total cannot exceed 100%
        let totalPercentage = 0;
        for (const client of parsedClients) {
          if (client.percentage < 10) {
            return res.status(400).json({
              ok: false,
              message: "Each client segment must be at least 10%"
            });
          }
          totalPercentage += client.percentage;
        }
        if (totalPercentage > 100) {
          return res.status(400).json({
            ok: false,
            message: "Total client percentage cannot exceed 100%"
          });
        }
      } catch (parseError) {
        console.error("Clients parse error:", parseError);
      }
    }

    // Create new listing request
    const newRequest = new CompanyListingRequest({
      user: userId,
      companyName,
      companyEmail,
      companyPhone,
      website: website || "",
      description: description || "",
      companyCountry: companyCountry || "",
      foundedYear: foundedYear ? parseInt(foundedYear) : null,
      employees: employees || "",
      linkedinUrl: linkedinUrl || "",
      facebookUrl: facebookUrl || "",
      twitterUrl: twitterUrl || "",
      categoryId,
      subcategoryId,
      image: imageUrl,
      teamLeads: parsedTeamLeads,
      minimumProjectSize: minimumProjectSize ? parseInt(minimumProjectSize) : null,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      services: parsedServices,
      focus: parsedFocus,
      industries: parsedIndustries,
      industryTags: parsedIndustryTags,
      clients: parsedClients, // Add clients data
      status: "pending"
    });

    await newRequest.save();

    // Send email notification to user
    await sendCompanyListingSubmittedNotificationToUser(companyEmail, companyName);

    // Send email notification to admin
    await sendNewCompanyListingNotificationToAdmin(companyName);

    return res.status(201).json({
      ok: true,
      message: "Company listing request submitted successfully",
      request: newRequest
    });
  } catch (err) {
    console.error("Error submitting company listing:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get all listing requests (for admin)
export const getAllListingRequests = async (req, res) => {
  try {
    const requests = await CompanyListingRequest.find()
      .populate('user', 'email')
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get user's listing requests (for website users)
export const getUserListingRequests = async (req, res) => {
  const userId = req.user?.userId; // From auth middleware

  try {
    const requests = await CompanyListingRequest.find({ user: userId })
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Approve a listing request (admin only)
export const approveListingRequest = async (req, res) => {
  const { requestId } = req.params;
  const adminUserId = req.user?.userId; // From auth middleware (admin)

  try {
    // Find the request (no populate needed as we want all fields)
    const request = await CompanyListingRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "Listing request not found"
      });
    }

    // Allow changing status from any status to approved
    const previousStatus = request.status;
    request.status = 'approved';
    request.approvedBy = adminUserId;
    request.approvedAt = new Date();
    
    await request.save();

    // Only create company and send email if status actually changed
    if (previousStatus !== 'approved') {
      // Get category and subcategory names
      const category = await Category.findById(request.categoryId);
      const subcategory = await Subcategory.findById(request.subcategoryId);

      // Create the company in the company team data collection
      // Generate a unique slug
      let slug = request.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      let slugExists = await CompanyTeamData.findOne({ slug: slug });
      let counter = 1;
      while (slugExists) {
        slug = `${request.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${counter}`;
        slugExists = await CompanyTeamData.findOne({ slug: slug });
        counter++;
      }
      
      const newCompany = new CompanyTeamData({
        companyName: request.companyName,
        subcategory: request.subcategoryId,
        categoryName: category?.name || "",
        description: request.description,
        employees: request.employees,
        website: request.website,
        slug: slug,
        linkedinUrl: request.linkedinUrl,
        facebookUrl: request.facebookUrl,
        twitterUrl: request.twitterUrl,
        companyCountry: request.companyCountry,
        foundedYear: request.foundedYear,
        image: request.image,
        claimedBy: request.user, // Automatically claim the company
        submittedThroughListingForm: true, // Mark as submitted through listing form
        teamLeads: request.teamLeads,
        // Added new fields
        minimumProjectSize: request.minimumProjectSize,
        hourlyRate: request.hourlyRate,
        // Service lines field
        services: request.services,
        // Focus areas field
        focus: request.focus,
        // Industries field (chart data)
        industries: request.industries,
        // Industry tags field
        industryTags: request.industryTags,
        // Clients field
        clients: request.clients
      });

      await newCompany.save();

      // Add company to subcategory
      await Subcategory.findByIdAndUpdate(
        request.subcategoryId,
        { $push: { companies: newCompany._id } },
        { new: true }
      );

      // Send email notification to user (only if email exists)
      if (request.companyEmail) {
        await sendCompanyListingApprovedNotificationToUser(request.companyEmail, request.companyName, subcategory?.name);
      }
    }

    return res.status(200).json({
      ok: true,
      message: "Listing request approved successfully",
      request
    });
  } catch (err) {
    console.error("Error approving listing request:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Reject a listing request (admin only)
export const rejectListingRequest = async (req, res) => {
  const { requestId } = req.params;
  const adminUserId = req.user?.userId; // From auth middleware (admin)

  try {
    // Find the request
    const request = await CompanyListingRequest.findById(requestId).populate('user', 'email');
    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "Listing request not found"
      });
    }

    // Allow changing status from any status to rejected
    const previousStatus = request.status;
    request.status = 'rejected';
    request.approvedBy = adminUserId;
    request.approvedAt = new Date();
    
    await request.save();

    // Send email notification to user (only if status changed and email exists)
    if (previousStatus !== 'rejected' && request.companyEmail) {
      await sendCompanyListingRejectedNotificationToUser(request.companyEmail, request.companyName);
    }

    return res.status(200).json({
      ok: true,
      message: "Listing request rejected successfully",
      request
    });
  } catch (err) {
    console.error("Error rejecting listing request:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get all categories with subcategories (for frontend form)
export const getCategoriesWithSubcategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('subcategories', 'name slug');
    
    return res.status(200).json({
      ok: true,
      categories
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get company services by company ID
export const getCompanyServices = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Find the company by ID
    const company = await CompanyTeamData.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }
    
    return res.status(200).json({
      ok: true,
      services: company.services || []
    });
  } catch (err) {
    console.error("Error fetching company services:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get company focus by company ID
export const getCompanyFocus = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Find the company by ID
    const company = await CompanyTeamData.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }
    
    return res.status(200).json({
      ok: true,
      focus: company.focus || []
    });
  } catch (err) {
    console.error("Error fetching company focus:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get company industries by company ID
export const getCompanyIndustries = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Find the company by ID
    const company = await CompanyTeamData.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }
    
    return res.status(200).json({
      ok: true,
      industries: company.industries || []
    });
  } catch (err) {
    console.error("Error fetching company industries:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get company clients by company ID
export const getCompanyClients = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Find the company by ID
    const company = await CompanyTeamData.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }
    
    return res.status(200).json({
      ok: true,
      clients: company.clients || []
    });
  } catch (err) {
    console.error("Error fetching company clients:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Delete a listing request (admin only)
export const deleteListingRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    // Find the listing request first (before deleting) to check if we need to delete associated company
    const request = await CompanyListingRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "Listing request not found"
      });
    }

    // If the request was approved, we should also try to delete the associated company
    let companyDeleted = false;
    if (request.status === 'approved') {
      try {
        // Try to find and delete the associated company by matching company name and subcategory
        // Generate the slug the same way it was created during approval
        let slug = request.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Try to find the company with the basic slug first
        let company = await CompanyTeamData.findOne({ 
          companyName: request.companyName,
          subcategory: request.subcategoryId,
          slug: slug
        });
        
        // If not found, try with counter suffixes (up to 100)
        let counter = 1;
        while (!company && counter <= 100) {
          const slugWithCounter = `${request.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${counter}`;
          company = await CompanyTeamData.findOne({ 
            companyName: request.companyName,
            subcategory: request.subcategoryId,
            slug: slugWithCounter
          });
          counter++;
        }
        
        // If we found the company, delete it
        if (company) {
          // Remove company from subcategory's companies array
          await Subcategory.findByIdAndUpdate(
            request.subcategoryId,
            { $pull: { companies: company._id } },
            { new: true }
          );
          
          // Delete the company
          await CompanyTeamData.findByIdAndDelete(company._id);
          companyDeleted = true;
        }
      } catch (companyError) {
        console.error("Error deleting associated company:", companyError);
        // We don't return here because we still want to delete the listing request
      }
    }

    // Now delete the listing request
    await CompanyListingRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      ok: true,
      message: companyDeleted 
        ? "Listing request and associated company deleted successfully" 
        : "Listing request deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting listing request:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};
  