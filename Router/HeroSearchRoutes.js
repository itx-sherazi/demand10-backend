import express from "express";
import { heroSearchCompanies } from "../controller/heroSearchController.js";

const router = express.Router();

// Search companies for hero section autocomplete
router.get("/hero-search", heroSearchCompanies);

export default router;