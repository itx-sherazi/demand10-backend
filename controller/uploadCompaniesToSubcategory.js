import xlsx from "xlsx";
import CompanyTeamData from "../model/TeamCompany.js";
import Subcategory from "../model/Subcategory.js";
import CompanyClaim from "../model/CompanyClaim.js";
import { Readable } from "stream";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// Helper function to create safe slugs
function createSafeSlug(companyName) {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}
export const uploadCompaniesToSubcategory = async (req, res) => {
  try {
    const subcategoryName = req.body.subcategoryName?.trim();
    const fileBuffer = req.files?.file?.[0]?.buffer;

    if (!subcategoryName || !fileBuffer) {
      return res.status(400).json({
        message: "subcategoryName and Excel file are required.",
      });
    }

    // Add buffer validation
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      return res.status(400).json({
        message: "Invalid file buffer. Please try uploading again.",
      });
    }

    const startTime = Date.now();

    // Find subcategory with better error handling
    let subcategory;
    try {
      subcategory = await Subcategory.findOne({
        name: new RegExp(`^${escapeRegex(subcategoryName)}$`, "i"),
      });
    } catch (regexError) {
      console.error("RegExp Error:", regexError.message);
      // Fallback to simple string comparison
      subcategory = await Subcategory.findOne({
        name: { $regex: subcategoryName, $options: "i" },
      });
    }

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found." });
    }

    // Excel parsing with retry mechanism
    let workbook;
    let parseAttempts = 0;
    const maxAttempts = 3;

    while (parseAttempts < maxAttempts) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        workbook = xlsx.read(fileBuffer, {
          type: "buffer",
          cellText: false,
          cellNF: false,
          raw: false, // Prevent formula errors
        });
        break;
      } catch (parseError) {
        parseAttempts++;
        // console.warn(`Excel parse attempt ${parseAttempts} failed:`, parseError.message);

        if (parseAttempts === maxAttempts) {
          return res.status(400).json({
            message:
              "Failed to parse Excel file. Please check file format and try again.",
            error: parseError.message,
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Validate sheets exist
    if (!workbook.Sheets["Companies"] || !workbook.Sheets["TeamLeads"]) {
      return res.status(400).json({
        message: "Excel file must contain 'Companies' and 'TeamLeads' sheets.",
      });
    }

    // Convert sheets to JSON with error handling
    let companiesSheet, teamLeadsSheet;
    try {
      companiesSheet = xlsx.utils.sheet_to_json(workbook.Sheets["Companies"]);
      teamLeadsSheet = xlsx.utils.sheet_to_json(workbook.Sheets["TeamLeads"]);
    } catch (sheetError) {
      return res.status(400).json({
        message: "Error processing Excel sheets. Please check data format.",
        error: sheetError.message,
      });
    }

    // Validate data exists
    if (!companiesSheet.length) {
      return res.status(400).json({
        message: "No company data found in Excel file.",
      });
    }

    // Process and validate company data
    const validCompanies = [];
    const duplicateTracker = new Set();

    for (let row of companiesSheet) {
      const rawCompany = row.Company ?? "";
      const companyName = String(rawCompany).trim();

      if (!companyName) {
        // console.warn(`Invalid company name, skipping:`, row.Company);
        continue;
      }

      const normalizedName = companyName.toLowerCase();

      // Skip duplicates within the Excel file
      if (duplicateTracker.has(normalizedName)) {
        continue;
      }

      duplicateTracker.add(normalizedName);

      const slug = createSafeSlug(companyName);
      if (!slug) {
        continue;
      }

      validCompanies.push({
        ...row,
        Company: companyName,
        slug: slug,
        normalizedName: normalizedName,
      });
    }

    // Check for existing companies in batches
    const BATCH_SIZE = 100;
    const existingCompanies = new Map(); // Use Map for better performance
    const allSlugs = validCompanies.map((c) => c.slug);
    const allNames = validCompanies.map((c) => c.normalizedName);

    // Process in batches to avoid memory issues
    for (let i = 0; i < allSlugs.length; i += BATCH_SIZE) {
      const slugBatch = allSlugs.slice(i, i + BATCH_SIZE);
      const nameBatch = allNames.slice(i, i + BATCH_SIZE);

      const batchResult = await CompanyTeamData.find({
        $or: [
          { slug: { $in: slugBatch } },
          {
            companyName: {
              $in: nameBatch.map(
                (name) => new RegExp(`^${escapeRegex(name)}$`, "i")
              ),
            },
          },
        ],
      }).select("slug _id companyName");

      batchResult.forEach((company) => {
        existingCompanies.set(company.slug, company._id);
        existingCompanies.set(
          company.companyName.toLowerCase().trim(),
          company._id
        );
      });
    }

    // Prepare bulk operations for new companies only
    const bulkCompanyOps = [];
    const companyMap = {};

    for (let companyData of validCompanies) {
      const {
        Company,
        "# Employees": employees,
        Industry,
        Website: website,
        "Short Description": description,
        "Company Linkedin Url": linkedinUrl,
        "Facebook Url": facebookUrl,
        "Twitter Url": twitterUrl,
        "Company Country": companyCountry,
        "Founded Year": foundedYear,
        "Logo Url": logoUrl,
        slug,
        normalizedName,
      } = companyData;

      // Check if company already exists
      const existingId =
        existingCompanies.get(slug) || existingCompanies.get(normalizedName);

      if (existingId) {
        companyMap[normalizedName] = existingId;
        // console.warn(`Company already exists: ${Company}`);
        continue;
      }

      // Generate unique ObjectId to prevent duplicate _id errors
      const newObjectId = new mongoose.Types.ObjectId();

      bulkCompanyOps.push({
        insertOne: {
          document: {
            _id: newObjectId,
            companyName: Company,
            employees: isNaN(parseInt(employees))
              ? employees
              : parseInt(employees),
            // Changed from industries to industryTags since this is just a comma-separated list
            industryTags: Industry?.split(",").map((i) => i.trim()) || [],
            website: website?.trim() || null,
            description: description?.trim() || null,
            linkedinUrl: linkedinUrl?.trim() || null,
            facebookUrl: facebookUrl?.trim() || null,
            twitterUrl: twitterUrl?.trim() || null,
            companyCountry: companyCountry?.trim() || null,
            foundedYear: parseInt(foundedYear) || null,
            image: logoUrl?.trim() || null,
            slug: slug,
            subcategory: subcategory._id,
            submittedThroughListingForm: false, // Explicitly set to false for manually added companies
            teamLeads: [],
            createdAt: new Date(), // Explicitly set creation date
            updatedAt: new Date() // Explicitly set update date
          },
        },
      });

      companyMap[normalizedName] = newObjectId;
    }

    let insertedCount = 0;
    let bulkWriteResult;

    // Execute bulk insert with improved error handling
    if (bulkCompanyOps.length > 0) {
      try {
        bulkWriteResult = await CompanyTeamData.bulkWrite(bulkCompanyOps, {
          ordered: false,
          bypassDocumentValidation: false,
        });

        insertedCount =
          bulkWriteResult.insertedCount || bulkWriteResult.nInserted || 0;

      } catch (bulkError) {
        // Some inserts failed due to duplicates or validation issues

        // Extract successful insertions even if some failed
        insertedCount =
          bulkError?.result?.insertedCount || bulkError?.result?.nInserted || 0;

        // Partial success logging

        // Log specific errors for debugging
        if (bulkError.writeErrors) {
          bulkError.writeErrors.slice(0, 5).forEach((error) => {
            console.warn(`Insert error: ${error.errmsg}`);
          });
        }
      }
    }

    // Update subcategory with all companies (existing + new)
    const allCompanyIds = [...new Set(Object.values(companyMap))];
    const validCompanyIds = allCompanyIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validCompanyIds.length > 0) {
      await Subcategory.updateOne(
        { _id: subcategory._id },
        { $addToSet: { companies: { $each: validCompanyIds } } }
      );
    }

    // Process Team Leads with better duplicate handling
    const leadsByCompany = {};
    const invalidLeads = [];

    for (let lead of teamLeadsSheet) {
      const rawLeadCompany = lead["Company"] ?? "";
      const companyName = String(rawLeadCompany).trim();

      // const companyName = lead["Company"]?.trim();
      const { Name, FacebookUrl, LinkedinUrl, TwitterUrl, Position } = lead;

      if (
        !companyName ||
        !Name ||
        typeof companyName !== "string" ||
        typeof Name !== "string"
      ) {
        invalidLeads.push(lead);
        continue;
      }

      function normalizeName(name) {
        return name?.toLowerCase().trim();
      }
      const normalizedCompanyName = normalizeName(companyName);

      if (
        typeof leadsByCompany[normalizedCompanyName] !== "object" ||
        !(leadsByCompany[normalizedCompanyName] instanceof Map)
      ) {
        // console.warn(`Expected Map but got:`, leadsByCompany[normalizedCompanyName]);
        leadsByCompany[normalizedCompanyName] = new Map();
      }

      if (!(leadsByCompany[normalizedCompanyName] instanceof Map)) {
        leadsByCompany[normalizedCompanyName] = new Map();
      }

      // Create unique key for team lead
      const leadKey = `${Name.toLowerCase().trim()}_${(
        Position || "no_position"
      )
        .toLowerCase()
        .trim()}`;

      // Only add if not duplicate
      if (!leadsByCompany[normalizedCompanyName].has(leadKey)) {
        leadsByCompany[normalizedCompanyName].set(leadKey, {
          name: Name.trim(),
          facebookUrl: FacebookUrl?.trim() || null,
          linkedinUrl: LinkedinUrl?.trim() || null,
          twitterUrl: TwitterUrl?.trim() || null,
          position: Position?.trim() || null,
        });
      }
    }

    // Bulk update companies with team leads
    const bulkUpdateOps = [];
    for (const [companyKey, leadsMap] of Object.entries(leadsByCompany)) {
      const companyId = companyMap[companyKey];
      if (!companyId) continue;

      const leads = Array.from(leadsMap.values());

      // Add all leads for this company in one operation
      if (leads.length > 0) {
        bulkUpdateOps.push({
          updateOne: {
            filter: { _id: companyId },
            update: { $push: { teamLeads: { $each: leads } } },
          },
        });
      }
    }

    if (bulkUpdateOps.length > 0) {
      try {
        await CompanyTeamData.bulkWrite(bulkUpdateOps, { ordered: false });
      } catch (updateError) {
        // Some team leads updates failed
      }
    }

    // Fetch updated subcategory
    const updatedSubcategory = await Subcategory.findById(
      subcategory._id
    ).populate({
      path: "companies",
      select:
        "companyName slug industryTags website employees foundedYear image teamLeads description",
    });

    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;



    // Calculate team leads processed
    const totalTeamLeadsProcessed = Object.values(leadsByCompany).reduce(
      (sum, leadsMap) => sum + leadsMap.size,
      0
    );

    const successSummary =
      `✅ ${validCompanies.length} companies processed\n` +
      `✅ ${insertedCount} new added\n` +
      `✅ ${totalTeamLeadsProcessed} team leads processed\n` +
      `🕒 Took ${processingTime} seconds`;

    res.status(201).json({
      success: true,
      message: successSummary,
      subcategory: updatedSubcategory,
      stats: {
        totalCompaniesInFile: companiesSheet.length,
        validCompanies: validCompanies.length,
        newCompaniesInserted: insertedCount,
        existingCompaniesFound: validCompanies.length - bulkCompanyOps.length,
        totalTeamLeadsInFile: teamLeadsSheet.length,
        teamLeadsProcessed: totalTeamLeadsProcessed,
        invalidTeamLeads: invalidLeads.length,
        processingTime: `${processingTime} seconds`,
      },
    });
  } catch (err) {
    // Log the full error for debugging
    console.error('Error in uploadCompaniesToSubcategory:', err);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Server error occurred while uploading companies';
    
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid data format: ' + err.message;
    } else if (err.code === 11000) {
      errorMessage = 'Duplicate key error: ' + Object.keys(err.keyPattern).join(', ') + ' already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({
      success: false,
      message: "Server error occurred. Please try again.",
      error: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
    });
  }
};
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format"
      });
    }

    const company = await CompanyTeamData.findById(id)
      .populate({
        path: 'subcategory',
        select: 'name slug',
      })
      .lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    res.status(200).json({
      ok: true,
      data: company,
    });
  } catch (err) {
    // Log the full error for debugging
    console.error('Error in getCompanyById:', err);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Server error occurred while fetching company';
    
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid data format: ' + err.message;
    } else if (err.code === 11000) {
      errorMessage = 'Duplicate key error: ' + Object.keys(err.keyPattern).join(', ') + ' already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
    });
  }
};
export const getCompanyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const company = await CompanyTeamData.findOne({ slug })
      .populate({
        path: 'subcategory',
        select: 'name slug',
      })
      .lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    res.status(200).json({
      ok: true,
      data: company,
    });
  } catch (err) {
    // Log the full error for debugging
    console.error('Error in getCompanyBySlug:', err);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Server error occurred while fetching company';
    
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid data format: ' + err.message;
    } else if (err.code === 11000) {
      errorMessage = 'Duplicate key error: ' + Object.keys(err.keyPattern).join(', ') + ' already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
    });
  }
};
export const searchCompanies = async (req, res) => {
  try {
    const { company_name, company_country, subcategory_slug } = req.query;

    let orConditions = [];

    // 1. Company Name
    if (company_name && company_name.trim() !== "") {
      orConditions.push({
        companyName: { $regex: company_name.trim(), $options: "i" },
      });
    }

    // 2. Company Country
    if (company_country && company_country.trim() !== "") {
      orConditions.push({
        companyCountry: { $regex: company_country.trim(), $options: "i" },
      });
    }

    // 3. Subcategory Slug -> Get ObjectId
    if (subcategory_slug && subcategory_slug.trim() !== "") {
      const subcategory = await Subcategory.findOne({
        slug: subcategory_slug.trim(),
      });
      if (subcategory) {
        orConditions.push({
          subcategory: subcategory._id,
        });
      }
    }

    // 🛑 If no valid filter, return all OR empty
    if (orConditions.length === 0) {
      return res
        .status(200)
        .json({ ok: true, data: [], message: "No valid filters provided." });
    }

    // 🧠 Query with OR condition
    const companies = await CompanyTeamData.find({ $or: orConditions }).lean();

    res.status(200).json({
      ok: true,
      data: companies,
    });
  } catch (err) {
    // Log the full error for debugging
    console.error('Error in searchCompanies:', err);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Server error occurred while searching companies';
    
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid data format: ' + err.message;
    } else if (err.code === 11000) {
      errorMessage = 'Duplicate key error: ' + Object.keys(err.keyPattern).join(', ') + ' already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({
      ok: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
    });
  }
};
export const getAllCompaniesCategory = async (req, res) => {
  try {
    // Get query parameters
    const { page = 1, limit = 50, search = '' } = req.query;
    
    // Convert to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10)  ;
    const skip = (pageNum - 1) * limitNum;

    // Build search filter
    let searchFilter = {};
    if (search && search.trim() !== '') {
      searchFilter = {
        companyName: { $regex: search.trim(), $options: 'i' }
      };
    }

    // Get total count for pagination (from ALL companies matching search)
    const totalCompanies = await CompanyTeamData.countDocuments(searchFilter);
    
    // Get companies with pagination
    const companies = await CompanyTeamData.find(searchFilter)
      .populate({
        path: 'subcategory',
        select: 'name slug',
      })
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalCompanies / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      ok: true,
      message: search 
        ? `Companies matching "${search}" retrieved successfully` 
        : "All companies retrieved successfully",
      data: {
        companies: companies,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCompanies,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
        },
        search: {
          query: search,
          resultsFound: totalCompanies,
          showingResults: companies.length
        }
      }
    });
  } catch (err) {
    // Log the full error for debugging
    console.error('Error in getAllCompaniesCategory:', err);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Server error occurred while fetching companies';
    
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid data format: ' + err.message;
    } else if (err.code === 11000) {
      errorMessage = 'Duplicate key error: ' + Object.keys(err.keyPattern).join(', ') + ' already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({
      ok: false,
      message: "Server error occurred while fetching companies",
      error: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
    });
  }
};

export const updateCompanyTeamBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { teamLeads, services, focus, clients, industries, industryTags, ...companyData } = req.body;

    // Parse JSON strings if they exist
    let parsedTeamLeads = [];
    let parsedServices = [];
    let parsedFocus = [];
    let parsedClients = [];
    let parsedIndustries = [];
    let parsedIndustryTags = [];

    if (teamLeads) {
      try {
        parsedTeamLeads = typeof teamLeads === 'string' ? JSON.parse(teamLeads) : teamLeads;
      } catch (error) {
        parsedTeamLeads = [];
      }
    }

    // Parse services array
    if (services) {
      try {
        parsedServices = typeof services === 'string' ? JSON.parse(services) : services;
      } catch (error) {
        parsedServices = [];
      }
    }

    // Parse focus array
    if (focus) {
      try {
        parsedFocus = typeof focus === 'string' ? JSON.parse(focus) : focus;
      } catch (error) {
        parsedFocus = [];
      }
    }

    // Parse clients array
    if (clients) {
      try {
        parsedClients = typeof clients === 'string' ? JSON.parse(clients) : clients;
      } catch (error) {
        parsedClients = [];
      }
    }

    if (industries) {
      try {
        parsedIndustries = typeof industries === 'string' ? JSON.parse(industries) : industries;
        
        // Validate that we have the correct structure
        if (Array.isArray(parsedIndustries)) {
          // Transform simple strings to object format if needed
          parsedIndustries = parsedIndustries.map(industry => {
            if (typeof industry === 'string') {
              // Convert old string format to new object format
              return {
                industryName: industry,
                percentage: 10 // Default percentage
              };
            } else if (typeof industry === 'object' && industry.industryName && industry.percentage) {
              // Already in correct format
              return industry;
            } else {
              // Fallback for malformed data
              return {
                industryName: String(industry),
                percentage: 10
              };
            }
          });
        }
      } catch (error) {
        // Fallback: treat as comma-separated string
        const industryStrings = typeof industries === 'string' ? industries.split(',').map(i => i.trim()) : [];
        parsedIndustries = industryStrings.map(industryName => ({
          industryName,
          percentage: 10
        }));
      }
    }

    if (industryTags) {
      try {
        parsedIndustryTags = typeof industryTags === 'string' ? JSON.parse(industryTags) : industryTags;
      } catch (error) {
        parsedIndustryTags = typeof industryTags === 'string' ? industryTags.split(',').map(i => i.trim()) : industryTags;
      }
    }

    // Build update object
    const updateData = {
      ...companyData,
      teamLeads: parsedTeamLeads,
      services: parsedServices,
      focus: parsedFocus,
      clients: parsedClients,
      industries: parsedIndustries,
      industryTags: parsedIndustryTags
    };

    if (req.file) {
      const existingCompany = await CompanyTeamData.findOne({ slug });
      
      
      
      if (existingCompany && existingCompany.image) {
        try {
       
          const backendRoot = path.join(__dirname, '..');
          const oldImagePath = path.join(backendRoot, existingCompany.image);
          
          
          
          // Check if file exists and delete it
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log(`Deleted old image file: ${oldImagePath}`);
          } else {
            console.log(`Old image file not found: ${oldImagePath}`);
            // Also log the directory contents for debugging
            const uploadDir = path.join(backendRoot, 'uploads', 'listing-images');
            if (fs.existsSync(uploadDir)) {
              const files = fs.readdirSync(uploadDir);
              console.log('Files in listing-images directory:', files);
            }
          }
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
          // Don't fail the update if image deletion fails
        }
      }
      
      // Save the local path to the image
      updateData.image = `/uploads/listing-images/${req.file.filename}`;
    }

    // Update company
    const updatedCompany = await CompanyTeamData.findOneAndUpdate(
      { slug },
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'subcategory',
      select: 'name slug',
    });

    if (!updatedCompany) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }

    res.status(200).json({
      ok: true,
      message: "Company updated successfully",
      data: updatedCompany
    });
  } catch (err) {
    // Log the full error for debugging
    console.error('Error in updateCompanyTeamBySlug:', err);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Server error occurred while updating company';
    
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid data format: ' + err.message;
    } else if (err.code === 11000) {
      errorMessage = 'Duplicate key error: ' + Object.keys(err.keyPattern).join(', ') + ' already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({
      ok: false,
      message: "Server error occurred while updating company",
      error: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
    });
  }
};

// 🆕 Delete Company with Team Leads
export const deleteCompanyTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the company to be deleted
    const deletedCompany = await CompanyTeamData.findById(id);

    if (!deletedCompany) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }

    // If the company has an image, delete the image file
    if (deletedCompany.image) {
      try {
        // Log the image path for debugging
        console.log('Deleting company image:', deletedCompany.image);
        
        // Construct the full path to the image file
        // The deletedCompany.image is stored as "/uploads/listing-images/filename.ext"
        // We need to join it with the backend root directory
        const backendRoot = path.join(__dirname, '..');
        const imagePath = path.join(backendRoot, deletedCompany.image);
        
        // Log the full path for debugging
        console.log('Full path to company image:', imagePath);
        
        // Check if file exists and delete it
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted company image file: ${imagePath}`);
        } else {
          console.log(`Company image file not found: ${imagePath}`);
          // Also log the directory contents for debugging
          const uploadDir = path.join(backendRoot, 'uploads', 'listing-images');
          if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            console.log('Files in listing-images directory:', files);
          }
        }
      } catch (imageError) {
        console.error("Error deleting company image file:", imageError);
        // We don't return here because we still want to delete the company
      }
    }

    // If the company was claimed, reset the associated claim status
    if (deletedCompany.claimedBy) {
      // Find any approved claims for this company and reset their status
      const claims = await CompanyClaim.find({
        company: deletedCompany._id,
        status: 'approved'
      });
      
      // Reset the status of all approved claims for this company
      for (const claim of claims) {
        claim.status = 'pending'; // or 'deleted' depending on your preference
        claim.approvedBy = null;
        claim.approvedAt = null;
        await claim.save();
      }
    }

    // Delete the company
    await CompanyTeamData.findByIdAndDelete(id);

    // Remove company from subcategory
    if (deletedCompany.subcategory) {
      await Subcategory.updateOne(
        { _id: deletedCompany.subcategory },
        { $pull: { companies: deletedCompany._id } }
      );
    }

    res.status(200).json({
      ok: true,
      message: "Company deleted successfully",
      data: deletedCompany
    });
  } catch (err) {
    // Log the full error for debugging
    console.error('Error in deleteCompanyTeam:', err);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Server error occurred while deleting company';
    
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
      errorMessage = 'Invalid data format: ' + err.message;
    } else if (err.code === 11000) {
      errorMessage = 'Duplicate key error: ' + Object.keys(err.keyPattern).join(', ') + ' already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({
      ok: false,
      message: "Server error occurred while deleting company",
      error: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
    });
  }
};
