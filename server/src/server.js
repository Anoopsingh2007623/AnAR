import "dotenv/config";

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// ======================================
// DATABASE
// ======================================

connectDB();

// ======================================
// MIDDLEWARE
// ======================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "8mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "8mb",
  })
);

// ======================================
// RATE LIMIT
// ======================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// ======================================
// HOME
// ======================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to AnAR API 🚀",
    version: "1.0.0",
  });
});

// ======================================
// HEALTH CHECK
// ======================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "AnAR API",
    status: "running",
  });
});

// ======================================
// AUTH ROUTES
// ======================================

app.use("/api/auth", authRoutes);

// ======================================
// USER / PROFILE ROUTES
// ======================================

app.use("/api/users", userRoutes);

// ======================================
// VIDEO ROUTES
// ======================================

app.use("/api/videos", videoRoutes);

// ======================================
// ADMIN ROUTES
// IMPORTANT: 404 HANDLER SE PEHLE
// ======================================

app.use("/api/admin", adminRoutes);

// ======================================
// 404
// ======================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// ======================================
// ERROR HANDLER
// ======================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ======================================
// START SERVER
// ======================================

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("             🚀 AnAR SERVER");
  console.log("======================================");

  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Videos: http://localhost:${PORT}/api/videos`);
  console.log(`Admin: http://localhost:${PORT}/api/admin`);

  console.log("======================================");
  console.log("");
});