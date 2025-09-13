import CompanyTeamData from "../model/TeamCompany.js";
import Subcategory from "../model/Subcategory.js";

// Search companies for hero section autocomplete
export const heroSearchCompanies = async (req, res) => {
  try {
    // Get company_name from query parameters
    const { company_name } = req.query;

    // Log the received parameters for debugging
    console.log("Hero search query parameters:", { company_name });

    // Validate that company_name parameter is provided
    if (!company_name || company_name.trim() === "") {
      return res.status(200).json({ 
        ok: true, 
        data: [], 
        message: "No search term provided" 
      });
    }

    // Search for companies by name (case insensitive)
    const companies = await CompanyTeamData.find({
      companyName: { $regex: company_name.trim(), $options: "i" }
    })
    .populate({
      path: 'subcategory',
      select: 'name slug',
    })
    .limit(10) // Limit to 10 results for autocomplete
    .lean();

    res.status(200).json({
      ok: true,
      data: companies,
    });
  } catch (err) {
    console.error("Hero search companies error:", err);
    res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message,
    });
  }
};