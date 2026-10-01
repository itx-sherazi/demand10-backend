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

// ---------------------------------------------------------------
// CORS — MUST be first middleware, before helmet/compression/body
// ---------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://145.79.6.178:3000',
  'https://admin.demand10.com',
  'https://demand10.com',
  'https://www.demand10.com',
  'https://api.demand10.com',
  'https://vendor.demand10.com',
];

app.use(cors({
  origin: function (origin, callback) {
    // No origin (curl, mobile apps, server-to-server) → allow
    if (!origin) return callback(null, true);

    // Whitelisted origin → reflect it back
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }

    // In development, allow anything
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Denied — do NOT throw, just deny silently.
    // Throwing here prevents CORS headers from being set on error responses,
    // which is exactly what broke the admin login.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cookie',
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // cache preflight for 24h
  optionsSuccessStatus: 200,
}));

// Explicitly handle preflight for all routes (belt & suspenders)
app.options('*', cors());

// ---------------------------------------------------------------
// Security + compression (after CORS)
// ---------------------------------------------------------------
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(compression());

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Request timeouts — prevent slow requests from pinning connections
app.use((req, res, next) => {
  req.setTimeout(30_000);
  res.setTimeout(30_000);
  next();
});

// ---------------------------------------------------------------
// Static files (with cache headers)
// ---------------------------------------------------------------
app.use('/badges', express.static(path.join(process.cwd(), 'public', 'badges'), { maxAge: '7d' }));
app.use('/sponsor-badges', express.static(path.join(process.cwd(), 'public', 'sponsor-badges'), { maxAge: '7d' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { maxAge: '7d' }));

// ---------------------------------------------------------------
// Database
// ---------------------------------------------------------------
connectDB();

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// ---------------------------------------------------------------
// Routes — registered immediately, no Redis dependency
// ---------------------------------------------------------------
app.use('/api/v1', adminUserRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', companyClaimRoutes);
app.use('/api/v1', companyListingRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', badgeRoutes);
app.use('/api/v1', heroSearchRoutes);
app.use('/api/v1', PostRoute);
app.use('/api/v1', RequestRoute);
app.use('/api/v1', CategoryRoute);
app.use('/api/v1', CompanyTeamUpload);
app.use('/api/v1', cacheRoutes);

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler — MUST be last, MUST set CORS headers
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.message);

  // Ensure CORS headers are set even on errors
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    ok: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// ---------------------------------------------------------------
// Start server FIRST
// ---------------------------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// Connect Redis in background — non-blocking
connectRedis().catch((err) => {
  console.error("⚠️  Redis connection failed, app will run without cache:", err.message);
});

export default app;