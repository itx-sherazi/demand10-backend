import Category from "../model/Category.js";
import Subcategory from "../model/Subcategory.js";
import { slugify } from "../utils/sligfy.js";
import mongoose from "mongoose";

import CompanyTeamData from "../model/TeamCompany.js";

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const slug = slugify(name);

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Category already exists." });
    }

    const category = new Category({ name, slug });
    await category.save();

    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate("subcategories", "name slug")
      .lean();
    res.status(200).json({ ok: true, data: categories });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: err.message });
  }
};
export const editCategory = async (req, res) => {
  try {
    const { id } = req.params; // Get category ID from URL params
    const { name, subcategories } = req.body; // Get new name for category and subcategories to be updated

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID format." });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    const categorySlug = slugify(name, { lower: true });
    category.name = name;
    category.slug = categorySlug;

    if (subcategories && Array.isArray(subcategories)) {
      const updatedSubcategories = [];

      for (const subcategoryData of subcategories) {
        const { _id: subcategoryId, name: subcategoryName, description, totalCompanies } = subcategoryData;

        const subcategory = await Subcategory.findById(subcategoryId);
        if (!subcategory) {
          return res.status(404).json({
            message: `Subcategory with _id ${subcategoryId} not found.`,
          });
        }

        if (subcategory.category.toString() !== id) {
          return res.status(400).json({
            message: `Subcategory with _id ${subcategoryId} does not belong to this category.`,
          });
        }

        const subcategorySlug = slugify(subcategoryName, { lower: true });
        subcategory.name = subcategoryName;
        subcategory.slug = subcategorySlug;
            if (description !== undefined) subcategory.description = description;
    if (totalCompanies !== undefined) subcategory.totalCompanies = totalCompanies;

        await subcategory.save();

        updatedSubcategories.push(subcategory);
      }

      category.subcategories = updatedSubcategories;
    }

    await category.save();

    res.status(200).json({
      message: "Category and its subcategories updated successfully.",
      category,
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating category", error: err.message });
  }
};


export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    const subcategoryIds = category.subcategories;

    // Directly delete companies linked to these subcategories
    await CompanyTeamData.deleteMany({
      subcategory: { $in: subcategoryIds },
    });

    await Subcategory.deleteMany({ _id: { $in: subcategoryIds } });

    await Category.deleteOne({ _id: id });

    res.status(200).json({ message: "Category, its subcategories, and related companies deleted successfully." });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting category and related data",
      error: err.message,
    });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug })
      .populate("subcategories", "name slug")
      .lean();
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json({ ok: true, data: category });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching category", error: err.message });
  }
};
