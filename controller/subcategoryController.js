import Category from "../model/Category.js";
import Subcategory from "../model/Subcategory.js";
import CompanyTeamData from "../model/TeamCompany.js";
import Review from "../model/Review.js"; // ADDED IMPORT
import { slugify } from "../utils/sligfy.js";
import { client as redisClient } from "../config/redisClient.js";


export const createSubcategory = async (req, res) => {
  try {
    const { subcategories, categoryId } = req.body; // Remove description from here

    if (!subcategories || !categoryId) {
      return res
        .status(400)
        .json({ message: "subcategories and categoryId are required." });
    }

    if (!Array.isArray(subcategories) || subcategories.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid list of subcategories." });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    const createdSubcategories = [];

    for (const subcategoryData of subcategories) {
      const { name, description, totalCompanies } = subcategoryData; // Get description from individual subcategory

      if (!name) {
        return res
          .status(400)
          .json({ message: "Name is required for each subcategory." });
      }

      if (!description) {
        return res
          .status(400)
          .json({ message: "Description is required for each subcategory." });
      }

      // Convert totalCompanies to Number if it's provided as a string
      let totalCompaniesNum = totalCompanies;
      if (typeof totalCompanies === 'string') {
        // Remove commas if present before parsing
        const cleanedValue = totalCompanies.replace(/,/g, '');
        totalCompaniesNum = parseInt(cleanedValue, 10);
        if (isNaN(totalCompaniesNum)) {
          return res.status(400).json({
            message: "totalCompanies must be a valid number.",
          });
        }
      }

      const slug = slugify(name);

      // Check if the subcategory already exists
      const existing = await Subcategory.findOne({ slug });
      if (existing) {
        return res
          .status(400)
          .json({ message: `Subcategory "${name}" already exists.` });
      }

      const subcategory = new Subcategory({
        name,
        slug,
        description, // Now using individual description
        totalCompanies: totalCompaniesNum,
        category: category._id,
        
      });

      await subcategory.save();
      createdSubcategories.push(subcategory);

      category.subcategories.push(subcategory._id);
    }

    await category.save();

    res.status(201).json({
      message: "Subcategories created and linked to category",
      subcategories: createdSubcategories,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({})
      .populate("companies")
      .lean();

    res.status(200).json({ ok: true, data: subcategories });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching subcategories", error: err.message });
  }
};
export const getAllSubcategoriesDashboard = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({})
      .select("name description totalCompanies category slug") // Explicitly select required fields including slug
      .lean();

    res.status(200).json({ ok: true, data: subcategories });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching subcategories", error: err.message });
  }
};

export const editSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Use optional chaining and default values to avoid destructuring errors
    let name = req.body?.name;
    let description = req.body?.description;
    let totalCompanies = req.body?.totalCompanies;
    let details = req.body?.details;

    // Parse details if it's a JSON string (from FormData)
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch (parseError) {
        return res.status(400).json({ 
          message: "Invalid details format. Must be valid JSON.", 
          error: parseError.message 
        });
      }
    }

    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found." });
    }

    // Only update name, description, and slug if provided
    if (name !== undefined) {
      // ✅ slugify check
      const slug = slugify(name);
      const existing = await Subcategory.findOne({ slug });
      if (existing && existing._id.toString() !== id) {
        return res
          .status(400)
          .json({ message: `Subcategory with name "${name}" already exists.` });
      }
      
      subcategory.name = name;
      subcategory.slug = slug;
    }

    // Only update description if provided
    if (description !== undefined) {
      subcategory.description = description;
    }

    // Only update totalCompanies if provided
    if (totalCompanies !== undefined) {
      // Convert totalCompanies to Number if it's provided as a string
      if (typeof totalCompanies === 'string') {
        // Remove commas if present before parsing
        const cleanedValue = totalCompanies.replace(/,/g, '');
        const parsed = parseInt(cleanedValue, 10);
        if (isNaN(parsed)) {
          return res.status(400).json({
            message: "totalCompanies must be a valid number.",
          });
        }
        totalCompanies = parsed;
      }
      subcategory.totalCompanies = totalCompanies;
    }

    // ✅ Handle details (including images)
    if (details) {
      let updatedDetails = { ...subcategory.details.toObject(), ...details };
      subcategory.details = updatedDetails;
    }

    await subcategory.save();

    res.status(200).json({
      message: "Subcategory updated successfully 🚀",
      subcategory,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating subcategory", error: err.message });
  }
};
export const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await Subcategory.findById(id).populate("companies");
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found." });
    }

    const companies = subcategory.companies;

    await Promise.all(
      companies.map(async (company) => {
        await company.deleteOne();
      })
    );

    const category = await Category.findById(subcategory.category);
    if (category) {
      category.subcategories.pull(subcategory._id);
      await category.save();
    }

    await subcategory.deleteOne();

    res
      .status(200)
      .json({ message: "Subcategory and its companies deleted successfully." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting subcategory", error: err.message });
  }
};
export const getSubcategoryDetails = async (req, res) => {
  try {
    const { slug } = req.params;

    const subcategory = await Subcategory.findOne({ slug })
      .select("name slug details totalCompanies") // 👈 slug bhi select kiya
      .lean();

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found." });
    }

    // Fetch 5 sponsored companies for this subcategory
    const sponsorCompanies = await CompanyTeamData.find({
      subcategory: subcategory._id,
      sponsor: true
    })
    .select("companyName slug image website")
    .populate({
      path: 'subcategory',
      select: 'name slug'
    })
    .limit(5)
    .lean();

    // Sirf details object return karna
    res.status(200).json({
      ok: true,
      message: "Subcategory details fetched successfully",
      slug: subcategory.slug, // 👈 slug response me add kar diya
      name: subcategory.name,
      details: subcategory.details,
      totalCompanies: subcategory.totalCompanies,
      sponsorCompanies: sponsorCompanies // Add sponsored companies to response
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching subcategory details",
      error: err.message,
    });
  }
};

// Get all companies in a subcategory (paginated, no search)
export const getCompaniesBySubcategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || "";
    // New parameter to filter only sponsored companies
    const sponsoredOnly = req.query.sponsoredOnly === 'true';
    // New parameter to filter only homepage companies
    const homepage = req.query.homepage === 'true';

    
    // Check if subcategory exists first
    const existingSubcategory = await Subcategory.findOne({
      slug: slug.trim().toLowerCase(),
    }).select("name slug").lean();

    if (!existingSubcategory) {
      const allSubcategories = await Subcategory.find({}).select("name slug").lean();
      
      return res.status(404).json({ 
        message: `Subcategory '${slug}' not found.`,
        availableSubcategories: allSubcategories.map(s => s.slug)
      });
    }


    const cacheKey = `companies:${slug}:${page}:${limit}:${search}:${sponsoredOnly}:${homepage}`;
    const cached = await redisClient.get(cacheKey);

    // Step 1: Serve from cache if valid
    if (cached) {
      const { data, lastUpdated } = JSON.parse(cached);
      const ageInMinutes = (Date.now() - lastUpdated) / (1000 * 60);

      // Serve stale cache (older than 15 mins) in background while fetching fresh data
      if (ageInMinutes > 15) {
        refreshCompaniesData(slug, page, limit, search, sponsoredOnly, homepage, cacheKey).catch((err) =>
          console.error("Background refresh failed:", err)
        );
      }

      return res.status(200).json(data);
    }

    // Step 2: No cache - fetch from DB
    const data = await fetchCompaniesFromDB(slug, page, limit, search, sponsoredOnly, homepage);

    // Save to Redis with timestamp
    await redisClient.setEx(
      cacheKey,
      86400,
      JSON.stringify({ data, lastUpdated: Date.now() })
    );

    res.status(200).json(data);
  } catch (err) {
    console.error("Controller Error:", err);
    res
      .status(500)
      .json({ message: "Error fetching companies.", error: err.message });
  }
};

// Helper: Fetch fresh data from DB with search + pagination
async function fetchCompaniesFromDB(slug, page, limit, search, sponsoredOnly = false, homepage = false) {
  const skip = (page - 1) * limit;

  
  const subcategory = await Subcategory.findOne({
    slug: slug.trim().toLowerCase(),
  })
    .select("name slug description category companies totalCompanies details")
    .populate("category", "name")
    .lean();

  if (!subcategory) {
    console.log(`❌ Subcategory not found in DB: ${slug}`);
    throw new Error(`Subcategory '${slug}' not found in database.`);
  }


  // Build search filter
  let query = { _id: { $in: subcategory.companies } };

  // Add sponsorship filter if requested
  if (sponsoredOnly) {
    query.sponsor = true;
  }
  
  // Add homepage filter if requested
  if (homepage) {
    query.homepage = true;
  }

  if (search && search.trim() !== "") {
    const regex = new RegExp(search.trim(), "i"); // case-insensitive regex
    query = {
      ...query,
      $or: [{ companyName: regex }, { companyCountry: regex }],
    };
  }

  const total = await CompanyTeamData.countDocuments(query);

  const companies = await CompanyTeamData.find(query)
    .select(
      "-__v -linkedinUrl -facebookUrl -twitterUrl "
    )
    .populate({
      path: 'subcategory',
      select: 'name slug'
    })
    .skip(skip)
    .limit(limit)
    .lean();

  // Add ratings and review counts to each company
  const companiesWithRatings = await Promise.all(
    companies.map(async (company) => {
      // Calculate average rating and review count
      const reviews = await Review.find({ 
        company: company._id, 
        status: "approved" 
      });

      let averageRating = 0;
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => {
          return sum + (review.overallRating || 0);
        }, 0);
        
        averageRating = totalRating / reviews.length;
      }

      return {
        ...company,
        teamLeads: company.teamLeads ? company.teamLeads.length : 0,
        averageRating: averageRating.toFixed(1),
        totalReviews: reviews.length
      };
    })
  );

  return {
    message: "Companies fetched successfully.",
    name: subcategory.name,
    slug: subcategory.slug,
    totalCompanies: subcategory.totalCompanies,
    description: subcategory.description,
    categoryName: subcategory.category?.name || "No category found",
    details: subcategory.details,
    companies: companiesWithRatings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchTerm: search || "",
    },
  };
}

// Helper: Background refresh cache
async function refreshCompaniesData(slug, page, limit, search, sponsoredOnly, homepage, cacheKey) {

  const freshData = await fetchCompaniesFromDB(slug, page, limit, search, sponsoredOnly, homepage);
  await redisClient.setEx(
    cacheKey,
    86400,
    JSON.stringify({ data: freshData, lastUpdated: Date.now() })
  );
}

export const getCompaniesBySubcategorySlugSitemap = async (req, res) => {
  try {
    const { slug } = req.params;

    const subcategory = await Subcategory.findOne({
      slug: slug.trim().toLowerCase(),
    })
      .select("companies")
      .lean();

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found." });
    }

    const companies = await CompanyTeamData.find(
      { _id: { $in: subcategory.companies } },
      { slug: 1, updatedAt: 1, createdAt: 1 } // light fields only
    ).lean();

    res.status(200).json({
      companies,
      total: companies.length,
    });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({
      message: "Error fetching companies for sitemap.",
      error: err.message,
    });
  }
};
export const getRelatedCompanies = async (req, res) => {
  try {
    const { subcategory, excludeSlug } = req.body;

    if (!subcategory || !excludeSlug) {
      return res.status(400).json({
        message:
          "Both 'subcategory' and 'excludeSlug' are required in the body.",
      });
    }

    // Get the subcategory info first to include slug in response
    const subcategoryInfo = await Subcategory.findById(subcategory)
      .select('slug name')
      .lean();

    if (!subcategoryInfo) {
      return res.status(404).json({
        message: "Subcategory not found.",
      });
    }

    // Directly fetch only first 4 companies from DB (no shuffle, sorted by _id)
    const relatedCompanies = await CompanyTeamData.find(
      {
        subcategory,
        slug: { $ne: excludeSlug },
      },
      {
        companyName: 1,
        employees: 1,
        slug: 1,
        companyCountry: 1,
        image: 1,
        _id: 0,
      }
    )
      .limit(4) // ✅ Only get first 4
      .lean();

    // Add subcategory slug to each company for SEO-friendly URLs
    const companiesWithSubcategorySlug = relatedCompanies.map(company => ({
      ...company,
      subcategorySlug: subcategoryInfo.slug
    }));

    res.status(200).json({
      message: "First 4 related companies fetched successfully.",
      companies: companiesWithSubcategorySlug,
      subcategorySlug: subcategoryInfo.slug,
      subcategoryName: subcategoryInfo.name
    });
  } catch (error) {
    res.status(500).json({
      message: "Error while fetching related companies.",
      error: error.message,
    });
  }
};

// New function for SEO-friendly URLs: get company by subcategory and company slug
export const getCompanyBySubcategoryAndSlug = async (req, res) => {
  try {
    const { subcategorySlug, companySlug } = req.params;

    // First verify the subcategory exists
    const subcategory = await Subcategory.findOne({ slug: subcategorySlug })
      .select('_id name slug')
      .lean();

    if (!subcategory) {
      return res.status(404).json({ 
        ok: false,
        message: "Subcategory not found." 
      });
    }

    // Find the company by slug and verify it belongs to the subcategory
    const company = await CompanyTeamData.findOne({
      slug: companySlug,
      subcategory: subcategory._id
    })
      .populate('subcategory', 'name slug')
      .lean();

    if (!company) {
      // Let's check if the company exists with this slug in any subcategory
      const anyCompany = await CompanyTeamData.findOne({ slug: companySlug })
        .populate('subcategory', 'name slug')
        .lean();
        
      if (anyCompany) {
        // Calculate average rating for the company
        const reviews = await Review.find({ 
          company: anyCompany._id, 
          status: "approved" 
        });

        let averageRating = 0;
        let totalReviews = 0;
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0);
          averageRating = totalRating / reviews.length;
          totalReviews = reviews.length;
        }

        // ✅ Return the company data with safe defaults and validation
        const safeCompanyData = {
          ...anyCompany,
          companyName: anyCompany.companyName || 'Unknown Company',
          description: anyCompany.description || '',
          foundedYear: anyCompany.foundedYear || null,
          employees: anyCompany.employees || 0,
          industryTags: Array.isArray(anyCompany.industryTags) ? anyCompany.industryTags : [],
          teamLeads: Array.isArray(anyCompany.teamLeads) ? anyCompany.teamLeads : [],
          companyCountry: anyCompany.companyCountry || '',
          image: anyCompany.image || '/placeholder-logo.png',
          website: anyCompany.website || '#',
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews: totalReviews
        };
        
        return res.status(200).json({ 
          ok: true,
          message: "Company found in different subcategory.",
          data: safeCompanyData,
          subcategorySlug: anyCompany.subcategory?.slug,
          warning: `Company belongs to ${anyCompany.subcategory?.slug}, not ${subcategorySlug}`
        });
      } else {
        // Log for debugging but don't expose to user
      }
      
      return res.status(404).json({ 
        ok: false,
        message: "Company not found or doesn't belong to this subcategory."
      });
    }

    // Calculate average rating for the company
    const reviews = await Review.find({ 
      company: company._id, 
      status: "approved" 
    });

    let averageRating = 0;
    let totalReviews = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0);
      averageRating = totalRating / reviews.length;
      totalReviews = reviews.length;
    }

    // ✅ Ensure company data has safe defaults
    const safeCompanyData = {
      ...company,
      companyName: company.companyName || 'Unknown Company',
      description: company.description || '',
      foundedYear: company.foundedYear || null,
      employees: company.employees || 0,
      industryTags: Array.isArray(company.industryTags) ? company.industryTags : [],
      teamLeads: Array.isArray(company.teamLeads) ? company.teamLeads : [],
      companyCountry: company.companyCountry || '',
      image: company.image || '/placeholder-logo.png',
      website: company.website || '#',
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: totalReviews
    };

    res.status(200).json({
      ok: true,
      message: "Company fetched successfully.",
      data: safeCompanyData,
      subcategorySlug: subcategory.slug
    });
  } catch (error) {
    console.error("Error fetching company by subcategory and slug:", error);
    res.status(500).json({
      ok: false,
      message: "Error while fetching company.",
      error: error.message,
    });
  }
};

export const getRelatedSubcategories = async (req, res) => {
  try {
    const { subcategorySlug, limit = 5 } = req.body;

    if (!subcategorySlug) {
      return res.status(400).json({
        message: "subcategorySlug is required in the body.",
      });
    }

    // First, get the current subcategory to find its category
    const currentSubcategory = await Subcategory.findOne({ slug: subcategorySlug })
      .select('category')
      .lean();

    if (!currentSubcategory) {
      return res.status(404).json({
        message: "Subcategory not found.",
      });
    }

    // Get other subcategories from the same category, excluding the current one
    const relatedSubcategories = await Subcategory.find({
      category: currentSubcategory.category,
      slug: { $ne: subcategorySlug }
    })
      .select('name slug')
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      message: "Related subcategories fetched successfully.",
      subcategories: relatedSubcategories
    });
  } catch (error) {
    res.status(500).json({
      message: "Error while fetching related subcategories.",
      error: error.message,
    });
  }
};

// New function to get all homepage companies across all subcategories
export const getHomepageCompanies = async (req, res) => {
  try {
    // Find all companies with homepage=true and populate subcategory information
    const homepageCompanies = await CompanyTeamData.find({ homepage: true })
      .select("-__v -linkedinUrl -facebookUrl -twitterUrl -description")
      .populate('subcategory', 'slug name') // Populate subcategory with slug and name
      .lean();

    // Add ratings and review counts to each company
    const companiesWithRatings = await Promise.all(
      homepageCompanies.map(async (company) => {
        // Calculate average rating and review count
        const reviews = await Review.find({ 
          company: company._id, 
          status: "approved" 
        });

        let averageRating = 0;
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => {
            return sum + (review.overallRating || 0);
          }, 0);
          
          averageRating = totalRating / reviews.length;
        }

        // Ensure subcategory is properly formatted
        const subcategoryInfo = company.subcategory && company.subcategory.slug 
          ? {
              name: company.subcategory.name,
              slug: company.subcategory.slug
            }
          : null;

        const result = {
          ...company,
          subcategory: subcategoryInfo, // Include both name and slug
          teamLeads: company.teamLeads ? company.teamLeads.length : 0,
          averageRating: averageRating.toFixed(1),
          totalReviews: reviews.length
        };

        return result;
      })
    );

    res.status(200).json({
      message: "Homepage companies fetched successfully.",
      companies: companiesWithRatings,
      total: companiesWithRatings.length
    });
  } catch (err) {
    console.error("Controller Error:", err);
    res
      .status(500)
      .json({ message: "Error fetching homepage companies.", error: err.message });
  }
};

// Update company sponsorship status
export const updateCompanySponsorship = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { sponsor } = req.body;

    // Validate input
    if (typeof sponsor !== 'boolean') {
      return res.status(400).json({ 
        message: "Sponsor field must be a boolean value" 
      });
    }

    // Find and update the company
    const company = await CompanyTeamData.findByIdAndUpdate(
      companyId,
      { sponsor },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ 
        message: "Company not found" 
      });
    }

    res.status(200).json({
      message: `Company sponsorship ${sponsor ? 'enabled' : 'disabled'} successfully`,
      company: {
        id: company._id,
        companyName: company.companyName,
        sponsor: company.sponsor
      }
    });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ 
      message: "Error updating company sponsorship", 
      error: err.message 
    });
  }
};
