import express from "express";
import { 
  getAllCompaniesCategory,
  getCompanyBySlug, 
  searchCompanies, 
  uploadCompaniesToSubcategory,
  updateCompanyTeamBySlug, // Added new function
  deleteCompanyTeam,
  getCompanyById
} from "../controller/uploadCompaniesToSubcategory.js";
import csvUpload from "../middleware/csvUpload.js";
import multer from "../middleware/multer.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// Upload companies to subcategory
router.post(
  "/companies/upload-to-subcategory",
  adminAuthMiddleware,
  csvUpload.fields([
    { name: "file", maxCount: 1 }, // csv file
  ]),
  uploadCompaniesToSubcategory
);

// Get single company by slug
router.get("/companybyslug/:slug", getCompanyBySlug);

// Get single company by ID
router.get("/company/:id", getCompanyById);

// Search companies with filters
router.get("/search-companies", searchCompanies);

// 🆕 Get ALL companies with pagination and search
router.get("/companies/all", adminAuthMiddleware, getAllCompaniesCategory);

// 🆕 Update company with team leads (with image upload) - by slug
router.put("/updateCompanyTeamBySlug/:slug",  multer.single('image'), updateCompanyTeamBySlug);

// 🆕 Delete company with team leads
router.delete("/deleteCompanyTeam/:id", adminAuthMiddleware, deleteCompanyTeam);

export default router;