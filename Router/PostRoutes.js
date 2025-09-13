import express from "express";
import {
  createPost,
  getAllPosts,  
  getPostById,
  deletePost,
  getLatestPosts,
  getAllPostsSitemap,
} from "../controller/blogPost.js";
import upload from '../middleware/multer.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

router.post("/creat", adminAuthMiddleware, upload.single('image'), createPost);
router.get("/get", getAllPosts);
router.get("/get-sitemapblog", getAllPostsSitemap);

router.get("/getById/:slug", getPostById);
router.delete("/blogdelete/:id", deletePost);
router.get('/latest-posts', getLatestPosts);

export default router;