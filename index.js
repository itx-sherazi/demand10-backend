import express from "express";
import connectDB from "./config/Db.js";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import compression from "compression";
import helmet from "helmet";

import adminUserRoutes from './Router/AdminUserRoutes.js';
import userRoutes from './Router/UserRoutes.js';
import companyClaimRoutes from './Router/CompanyClaimRoutes.js';
import PostRoute from './Router/PostRoutes.js';
import RequestRoute from './Router/RequestRoute.js';
import CategoryRoute from './Router/CategoryRoute.js';
import CompanyTeamUpload from './Router/CompanyTeamRoute.js';
import cacheRoutes from './Router/ClearCache.js';
import companyListingRoutes from './Router/CompanyListingRoutes.js';
import reviewRoutes from './Router/ReviewRoutes.js';
import badgeRoutes from './Router/BadgeRoutes.js';
import heroSearchRoutes from './Router/HeroSearchRoutes.js';

import { connectRedis } from "./config/redisClient.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// Trust first proxy (nginx / load balancer) so x-forwarded-* headers work
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  "https://admin.demand10.com",
  'http://145.79.6.178:3000',
  'https://demand10.com',
  'https://www.demand10.com',
  'https://api.demand10.com',
  'https://vendor.demand10.com',
];

// Security + performance middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow any origin
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(cookieParser());

// Request timeouts — prevent slow requests from pinning connections
app.use((req, res, next) => {
  req.setTimeout(30_000);
  res.setTimeout(30_000);
  next();
});

// Static files with cache headers
app.use('/badges', express.static(path.join(process.cwd(), 'public', 'badges'), { maxAge: '7d' }));
app.use('/sponsor-badges', express.static(path.join(process.cwd(), 'public', 'sponsor-badges'), { maxAge: '7d' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { maxAge: '7d' }));

// Connect MongoDB
connectDB();

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Register ALL routes immediately (no Redis dependency)
app.use('/api/v1', adminUserRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', companyClaimRoutes);
app.use('/api/v1', companyListingRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', badgeRoutes);
app.use('/api/v1', heroSearchRoutes);
app.use("/api/v1", PostRoute);
app.use("/api/v1", RequestRoute);
app.use("/api/v1", CategoryRoute);
app.use("/api/v1", CompanyTeamUpload);
app.use('/api/v1', cacheRoutes);

// Global error handler - must be last
app.use(errorHandler);

// Start server FIRST
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// Connect Redis in background — non-blocking
connectRedis().catch((err) => {
  console.error("⚠️  Redis connection failed, app will run without cache:", err.message);
});

export default app;