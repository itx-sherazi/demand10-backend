// Backend utility for building SEO-friendly URLs
import CompanyTeamData from "../model/TeamCompany.js";
import Subcategory from "../model/Subcategory.js";

const BASE_URL = process.env.FRONTEND_URL || 'https://demand10.com';

/**
 * Build SEO-friendly URL for a company
 * @param {string} companySlug - Company slug
 * @returns {Promise<string|null>} - The SEO-friendly URL or null if not found
 */
export const buildCompanyUrl = async (companySlug) => {
  try {
    const company = await CompanyTeamData.findOne({ slug: companySlug })
      .populate('subcategory', 'slug')
      .lean();

    if (!company || !company.subcategory?.slug) {
      return null;
    }

    return `${BASE_URL}/${company.subcategory.slug}/${companySlug}`;
  } catch (error) {
    console.error('Error building company URL:', error);
    return null;
  }
};

/**
 * Build SEO-friendly URL for a subcategory
 * @param {string} subcategorySlug - Subcategory slug
 * @returns {string} - The SEO-friendly URL
 */
export const buildSubcategoryUrl = (subcategorySlug) => {
  return `${BASE_URL}/${subcategorySlug}`;
};

/**
 * Get all companies with their SEO-friendly URLs for a subcategory
 * @param {string} subcategorySlug - Subcategory slug
 * @returns {Promise<Array>} - Array of companies with their URLs
 */
export const getCompaniesWithUrls = async (subcategorySlug) => {
  try {
    const subcategory = await Subcategory.findOne({ slug: subcategorySlug })
      .select('_id name slug')
      .lean();

    if (!subcategory) {
      return [];
    }

    const companies = await CompanyTeamData.find({ subcategory: subcategory._id })
      .select('companyName slug image employees companyCountry')
      .lean();

    return companies.map(company => ({
      ...company,
      url: `${BASE_URL}/${subcategorySlug}/${company.slug}`,
      subcategoryUrl: `${BASE_URL}/${subcategorySlug}`
    }));
  } catch (error) {
    console.error('Error getting companies with URLs:', error);
    return [];
  }
};

/**
 * Generate sitemap data with SEO-friendly URLs
 * @param {string} subcategorySlug - Subcategory slug
 * @returns {Promise<Object>} - Sitemap data with new URLs
 */
export const generateSitemapData = async (subcategorySlug) => {
  try {
    const subcategory = await Subcategory.findOne({ slug: subcategorySlug })
      .select('_id name slug')
      .lean();

    if (!subcategory) {
      return { subcategory: null, companies: [] };
    }

    const companies = await CompanyTeamData.find({ subcategory: subcategory._id })
      .select('slug updatedAt createdAt')
      .lean();

    return {
      subcategory: {
        ...subcategory,
        url: `${BASE_URL}/${subcategorySlug}`
      },
      companies: companies.map(company => ({
        slug: company.slug,
        url: `${BASE_URL}/${subcategorySlug}/${company.slug}`,
        lastModified: company.updatedAt || company.createdAt || new Date()
      }))
    };
  } catch (error) {
    console.error('Error generating sitemap data:', error);
    return { subcategory: null, companies: [] };
  }
};
