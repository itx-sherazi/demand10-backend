import express from "express";
import connectDB from "./config/Db.js";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

import adminUserRoutes from './Router/AdminUserRoutes.js';
import userRoutes from './Router/UserRoutes.js';
import companyClaimRoutes from './Router/CompanyClaimRoutes.js';
import PostRoute from './Router/PostRoutes.js';
import RequestRoute from './Router/RequestRoute.js';
import CategoryRoute from './Router/CategoryRoute.js';
import CompanyTeamUpload from './Router/CompanyTeamRoute.js';
import cacheRoutes from './Router/ClearCache.js';
import companyListingRoutes from './Router/CompanyListingRoutes.js';
import reviewRoutes from './Router/ReviewRoutes.js'; // Added Review Routes
import badgeRoutes from './Router/BadgeRoutes.js'; // Added Badge Routes
import heroSearchRoutes from './Router/HeroSearchRoutes.js'; // Added Hero Search Routes

import { client as redisClient, connectRedis } from "./config/redisClient.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  "https://admin.demand10.com",
  'http://145.79.6.178:3000',
  'https://demand10.com',
  'https://www.demand10.com',
  'https://api.demand10.com',
  'https://vendor.demand10.com',
  "http://localhost:5173"
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins for testing
    callback(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());

// Serve static files from the public directory
app.use('/badges', express.static(path.join(process.cwd(), 'public', 'badges')));
app.use('/sponsor-badges', express.static(path.join(process.cwd(), 'public', 'sponsor-badges')));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Connect MongoDB
connectDB();
// Health check route
    app.get("/", (req, res) => {
      res.status(200).json({ message: "Server is running" });
    });
// Redis-connected routes setup inside the connectRedis flow
connectRedis()
  .then(() => {
    console.log("Redis connected");

    // Other API routes
    app.use('/api/v1', adminUserRoutes);
    app.use('/api/v1', userRoutes);
    app.use('/api/v1', companyClaimRoutes);
    app.use('/api/v1', companyListingRoutes);
    app.use('/api/v1', reviewRoutes); // Added Review Routes
    app.use('/api/v1', badgeRoutes); // Added Badge Routes
    app.use('/api/v1', heroSearchRoutes); // Added Hero Search Routes

    app.use("/api/v1", PostRoute);
    app.use("/api/v1", RequestRoute);
    app.use("/api/v1", CategoryRoute);
    app.use("/api/v1", CompanyTeamUpload);
    app.use('/api/v1', cacheRoutes);

    // Global error handler - should be the last middleware
    app.use(errorHandler);

    // Start server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  })
  .catch((err) => {
    console.error("Failed to connect to Redis", err);
    process.exit(1);
  });

export default app;