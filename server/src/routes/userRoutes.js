import express from "express";
import auth from "../middleware/auth.js";

import {
  getMyProfile,
  updateMyProfile,
  followUser,
  unfollowUser,
  getFollowStatus,
} from "../controllers/userController.js";

const router = express.Router();


// =====================================================
// MY PROFILE
// =====================================================

// GET /api/users/me
router.get(
  "/me",
  auth,
  getMyProfile
);

// PUT /api/users/me
router.put(
  "/me",
  auth,
  updateMyProfile
);


// =====================================================
// FOLLOW SYSTEM
// =====================================================

// FOLLOW
// POST /api/users/:userId/follow
router.post(
  "/:userId/follow",
  auth,
  followUser
);

// UNFOLLOW
// DELETE /api/users/:userId/follow
router.delete(
  "/:userId/follow",
  auth,
  unfollowUser
);

// CHECK FOLLOW STATUS
// GET /api/users/:userId/follow-status
router.get(
  "/:userId/follow-status",
  auth,
  getFollowStatus
);


export default router;