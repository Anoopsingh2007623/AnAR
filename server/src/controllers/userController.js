import User from "../models/User.js";
import Follow from "../models/Follow.js";

// =====================================================
// GET CURRENT USER PROFILE
// GET /api/users/me
// =====================================================

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("❌ GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};


// =====================================================
// UPDATE CURRENT USER PROFILE
// PUT /api/users/me
// =====================================================

export const updateMyProfile = async (req, res) => {
  try {
    const { name, username, bio, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------------
    // NAME
    // --------------------------------------

    if (name !== undefined) {
      const cleanName = String(name).trim();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      if (cleanName.length > 60) {
        return res.status(400).json({
          success: false,
          message: "Name cannot exceed 60 characters",
        });
      }

      user.name = cleanName;
    }

    // --------------------------------------
    // USERNAME
    // --------------------------------------

    if (username !== undefined) {
      const cleanUsername = String(username)
        .trim()
        .toLowerCase();

      if (!cleanUsername) {
        return res.status(400).json({
          success: false,
          message: "Username is required",
        });
      }

      if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({
          success: false,
          message:
            "Username must be 3-30 characters and contain only letters, numbers and underscore",
        });
      }

      // Check whether username belongs to another user
      const existingUser = await User.findOne({
        username: cleanUsername,
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Username is already taken",
        });
      }

      user.username = cleanUsername;
    }

    // --------------------------------------
    // BIO
    // --------------------------------------

    if (bio !== undefined) {
      const cleanBio = String(bio).trim();

      if (cleanBio.length > 160) {
        return res.status(400).json({
          success: false,
          message: "Bio cannot exceed 160 characters",
        });
      }

      user.bio = cleanBio;
    }

    // --------------------------------------
    // AVATAR
    // --------------------------------------

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    // --------------------------------------
    // SAVE
    // --------------------------------------

    await user.save();

    const updatedUser = await User.findById(user._id).select(
      "-passwordHash"
    );

    console.log(
      "✅ PROFILE UPDATED:",
      updatedUser.username
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ UPDATE PROFILE ERROR:", error);

    // MongoDB duplicate username error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};


// =====================================================
// FOLLOW USER
// POST /api/users/:userId/follow
// =====================================================

export const followUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;

    // Cannot follow yourself
    if (followerId.toString() === followingId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // Check target user
    const targetUser = await User.findById(followingId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check existing follow
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });
    }

    // Create relationship
    await Follow.create({
      follower: followerId,
      following: followingId,
    });

    // Creator followers +1
    await User.findByIdAndUpdate(
      followingId,
      {
        $inc: {
          followersCount: 1,
        },
      }
    );

    // Current user's following +1
    await User.findByIdAndUpdate(
      followerId,
      {
        $inc: {
          followingCount: 1,
        },
      }
    );

    // Get updated creator
    const updatedTargetUser = await User.findById(
      followingId
    ).select(
      "name username avatar followersCount followingCount accountType"
    );

    // Get updated current user
    const updatedCurrentUser = await User.findById(
      followerId
    ).select(
      "name username avatar followersCount followingCount accountType"
    );

    console.log(
      `✅ FOLLOW: ${followerId} -> ${followingId}`
    );

    return res.status(200).json({
      success: true,
      following: true,
      message: "User followed successfully",
      targetUser: updatedTargetUser,
      currentUser: updatedCurrentUser,
    });
  } catch (error) {
    console.error("❌ FOLLOW USER ERROR:", error);

    // Duplicate Follow protection
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to follow user",
    });
  }
};


// =====================================================
// UNFOLLOW USER
// DELETE /api/users/:userId/follow
// =====================================================

export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;

    const follow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    if (!follow) {
      return res.status(400).json({
        success: false,
        message: "You are not following this user",
      });
    }

    // Delete relationship
    await Follow.deleteOne({
      _id: follow._id,
    });

    // Creator followers -1
    await User.findByIdAndUpdate(
      followingId,
      {
        $inc: {
          followersCount: -1,
        },
      }
    );

    // Current user's following -1
    await User.findByIdAndUpdate(
      followerId,
      {
        $inc: {
          followingCount: -1,
        },
      }
    );

    // Get updated creator
    const updatedTargetUser = await User.findById(
      followingId
    ).select(
      "name username avatar followersCount followingCount accountType"
    );

    // Get updated current user
    const updatedCurrentUser = await User.findById(
      followerId
    ).select(
      "name username avatar followersCount followingCount accountType"
    );

    console.log(
      `✅ UNFOLLOW: ${followerId} -> ${followingId}`
    );

    return res.status(200).json({
      success: true,
      following: false,
      message: "User unfollowed successfully",
      targetUser: updatedTargetUser,
      currentUser: updatedCurrentUser,
    });
  } catch (error) {
    console.error("❌ UNFOLLOW USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unfollow user",
    });
  }
};


// =====================================================
// CHECK FOLLOW STATUS
// GET /api/users/:userId/follow-status
// =====================================================

export const getFollowStatus = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;

    // Same user
    if (followerId.toString() === followingId.toString()) {
      return res.status(200).json({
        success: true,
        following: false,
        self: true,
      });
    }

    const follow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    return res.status(200).json({
      success: true,
      following: !!follow,
    });
  } catch (error) {
    console.error(
      "❌ FOLLOW STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to check follow status",
    });
  }
};