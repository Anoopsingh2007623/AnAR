import express from "express";

import {
  uploadVideo,
  createVideo,
  getPublicVideos,
  getMyVideos,
  getUserVideos,
  getVideo,
  deleteVideo,

  // LIKE
  toggleVideoLike,
  getVideoLikeStatus,

  // COMMENTS
  addVideoComment,
  getVideoComments,

  // VIEWS
  registerVideoView,
} from "../controllers/videoController.js";

import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// =====================================================
// UPLOAD VIDEO FILE
// =====================================================

router.post(
  "/upload",
  auth,
  upload.single("video"),
  uploadVideo
);

// =====================================================
// CREATE VIDEO DATABASE RECORD
// =====================================================

router.post(
  "/",
  auth,
  createVideo
);

// =====================================================
// PUBLIC VIDEOS
//
// GET /api/videos
// GET /api/videos?type=long
// GET /api/videos?type=short
// =====================================================

router.get(
  "/",
  getPublicVideos
);

// =====================================================
// MY VIDEOS
//
// GET /api/videos/my
// GET /api/videos/my?type=long
// GET /api/videos/my?type=short
// =====================================================

router.get(
  "/my",
  auth,
  getMyVideos
);

// =====================================================
// USER VIDEOS
//
// GET /api/videos/user/USER_ID
// GET /api/videos/user/USER_ID?type=long
// GET /api/videos/user/USER_ID?type=short
// =====================================================

router.get(
  "/user/:userId",
  getUserVideos
);

// =====================================================
// LIKE / UNLIKE VIDEO
// POST = Like / Unlike
// =====================================================

router.post(
  "/:id/like",
  auth,
  toggleVideoLike
);

// =====================================================
// CHECK LIKE STATUS
// GET = true / false
// =====================================================

router.get(
  "/:id/like",
  auth,
  getVideoLikeStatus
);

// =====================================================
// GET VIDEO COMMENTS
// GET /api/videos/:id/comments
// =====================================================

router.get(
  "/:id/comments",
  getVideoComments
);

// =====================================================
// ADD VIDEO COMMENT
// POST /api/videos/:id/comments
// =====================================================

router.post(
  "/:id/comments",
  auth,
  addVideoComment
);

// =====================================================
// REGISTER VIDEO VIEW
//
// POST /api/videos/:id/view
//
// This increments the video's view count.
// =====================================================

router.post(
  "/:id/view",
  registerVideoView
);

// =====================================================
// SINGLE VIDEO
// =====================================================

router.get(
  "/:id",
  getVideo
);

// =====================================================
// DELETE VIDEO
// =====================================================

router.delete(
  "/:id",
  auth,
  deleteVideo
);

export default router;