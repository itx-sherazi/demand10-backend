import express from "express";
import {
  createCategory,
  deleteCategory,
  editCategory,
  getAllCategories,
  getCategoryBySlug,
} from "../controller/categoryController.js";
import {
  createSubcategory,
  deleteSubcategory,
  editSubcategory,
  getAllSubcategories,
  getAllSubcategoriesDashboard,
  getCompaniesBySubcategorySlug,
  getCompaniesBySubcategorySlugSitemap,
  getRelatedCompanies,
  getSubcategoryDetails,
  getCompanyBySubcategoryAndSlug,
  getRelatedSubcategories,
  updateCompanySponsorship,
  getHomepageCompanies, // Add this import
  updateSubcategoryContent,
  getSubcategoryById
} from "../controller/subcategoryController.js";
import upload from "../middleware/multer.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

//category routes
router.post("/create-category", adminAuthMiddleware, createCategory);
router.get("/categories", getAllCategories);
router.put("/edit-categories/:id", adminAuthMiddleware, editCategory);
router.delete("/delete-categories/:id", adminAuthMiddleware, deleteCategory);
router.get("/categorybyslug/:slug", getCategoryBySlug);

//subcategory routes
router.post(
  "/create-subcategory",
  adminAuthMiddleware,
  
  createSubcategory
);
router.get("/subcategories", getAllSubcategories);
router.put("/editsubcategories/:id", 
  adminAuthMiddleware,
  editSubcategory
);
router.put("/subcategory-content/:id", 
  adminAuthMiddleware,
  updateSubcategoryContent
);
router.get("/subcategory/:id", 
  adminAuthMiddleware,
  getSubcategoryById
);
router.delete("/deletesubcategories/:id", adminAuthMiddleware, deleteSubcategory);
router.post("/related-companies", adminAuthMiddleware, getRelatedCompanies);
router.post("/related-subcategories",  getRelatedSubcategories);
router.get("/subcategories-dashboard", adminAuthMiddleware, getAllSubcategoriesDashboard);
router.get("/sitemap-subcategory/:slug", getCompaniesBySubcategorySlugSitemap);
router.get("/detail/:slug", getSubcategoryDetails);

// Get all companies in a subcategory (paginated, no search)
router.get("/subcategories/companies/:slug", getCompaniesBySubcategorySlug);

// New route for SEO-friendly URLs: get company by subcategory and company slug
router.get("/company/:subcategorySlug/:companySlug", getCompanyBySubcategoryAndSlug);

// New route to update company sponsorship status
router.put("/company/:companyId/sponsor", adminAuthMiddleware, updateCompanySponsorship);

// New route to get homepage companies
router.get("/homepage-companies", getHomepageCompanies);

export default router;