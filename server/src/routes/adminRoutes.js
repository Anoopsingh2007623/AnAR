import express from "express";

import adminAuth from "../middleware/adminAuth.js";

import {
  adminLogin,
  getAdminProfile,
  getAdminDashboard,
  getAdminUsers,
  toggleUserBlock,
  deleteAdminUser,
  getAdminVideos,
  toggleVideoVisibility,
  deleteAdminVideo,
  getAdminComments,
  deleteAdminComment,
  changeAdminPassword,
} from "../controllers/adminController.js";

const router = express.Router();

// =====================================================
// ADMIN LOGIN
// =====================================================

router.post("/login", adminLogin);

// =====================================================
// ADMIN PROFILE
// =====================================================

router.get(
  "/me",
  adminAuth,
  getAdminProfile
);
// ==========================================
// CHANGE PASSWORD
// ==========================================

router.patch(
  "/password",
  adminAuth,
  changeAdminPassword
);

// =====================================================
// DASHBOARD
// =====================================================

router.get(
  "/dashboard",
  adminAuth,
  getAdminDashboard
);

// =====================================================
// USERS
// =====================================================

router.get(
  "/users",
  adminAuth,
  getAdminUsers
);

router.patch(
  "/users/:id/block",
  adminAuth,
  toggleUserBlock
);

router.delete(
  "/users/:id",
  adminAuth,
  deleteAdminUser
);

// =====================================================
// VIDEOS
// =====================================================

router.get(
  "/videos",
  adminAuth,
  getAdminVideos
);

router.patch(
  "/videos/:id/visibility",
  adminAuth,
  toggleVideoVisibility
);

router.delete(
  "/videos/:id",
  adminAuth,
  deleteAdminVideo
);

// =====================================================
// COMMENTS
// =====================================================

router.get(
  "/comments",
  adminAuth,
  getAdminComments
);

router.delete(
  "/comments/:id",
  adminAuth,
  deleteAdminComment
);

export default router;