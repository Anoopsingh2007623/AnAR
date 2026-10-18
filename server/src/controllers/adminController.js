import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import VideoLike from "../models/VideoLike.js";
import Follow from "../models/Follow.js";

import cloudinary from "../config/cloudinary.js";


// =====================================================
// ADMIN LOGIN
// =====================================================

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is disabled.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// ADMIN PROFILE
// =====================================================

export const getAdminProfile = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      admin: {
        _id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// DASHBOARD
// =====================================================

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      blockedUsers,
      totalVideos,
      totalLongVideos,
      totalShorts,
      totalComments,
      totalLikes,
      publicVideos,
      privateVideos,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Video.countDocuments(),
      Video.countDocuments({ type: "long" }),
      Video.countDocuments({ type: "short" }),
      Comment.countDocuments(),
      VideoLike.countDocuments(),
      Video.countDocuments({ visibility: "public" }),
      Video.countDocuments({ visibility: "private" }),
    ]);

    const viewsResult = await Video.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
        },
      },
    ]);

    const likesResult = await Video.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: "$likesCount" },
        },
      },
    ]);

    const commentsResult = await Video.aggregate([
      {
        $group: {
          _id: null,
          totalComments: { $sum: "$commentsCount" },
        },
      },
    ]);

    const totalViews =
      viewsResult[0]?.totalViews || 0;

    const totalVideoLikes =
      likesResult[0]?.totalLikes || 0;

    const totalVideoComments =
      commentsResult[0]?.totalComments || 0;

    const recentUsers = await User.find()
      .select(
        "name username avatar accountType isBlocked createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(5);

    const recentVideos = await Video.find()
      .populate(
        "owner",
        "name username avatar"
      )
      .select(
        "title type views likesCount commentsCount visibility createdAt owner"
      )
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,

      stats: {
        totalUsers,
        blockedUsers,

        totalVideos,
        totalLongVideos,
        totalShorts,

        totalComments,
        totalLikes,

        totalViews,

        totalVideoLikes,
        totalVideoComments,

        publicVideos,
        privateVideos,
      },

      recentUsers,
      recentVideos,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET USERS
// =====================================================

export const getAdminUsers = async (req, res, next) => {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          username: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "name username email phone avatar accountType followersCount followingCount monetization isBlocked createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,

      users,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// BLOCK / UNBLOCK USER
// =====================================================

export const toggleUserBlock = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isBlocked = !user.isBlocked;

    await user.save();

    return res.json({
      success: true,

      blocked: user.isBlocked,

      message: user.isBlocked
        ? "User blocked successfully."
        : "User unblocked successfully.",

      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// DELETE USER
// =====================================================

export const deleteAdminUser = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const videos = await Video.find({
      owner: userId,
    });

    for (const video of videos) {
      if (video.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(
            video.cloudinaryPublicId,
            {
              resource_type: "video",
            }
          );
        } catch (cloudinaryError) {
          console.error(
            "Cloudinary delete error:",
            cloudinaryError.message
          );
        }
      }
    }

    await Comment.deleteMany({
      user: userId,
    });

    await VideoLike.deleteMany({
      user: userId,
    });

    await Follow.deleteMany({
      $or: [
        { follower: userId },
        { following: userId },
      ],
    });

    await Video.deleteMany({
      owner: userId,
    });

    await User.deleteOne({
      _id: userId,
    });

    return res.json({
      success: true,
      message: "User and related content deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET VIDEOS
// =====================================================

export const getAdminVideos = async (
  req,
  res,
  next
) => {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    const type = req.query.type;

    const visibility = req.query.visibility;

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const skip = (page - 1) * limit;

    const filter = {};

    if (type === "long" || type === "short") {
      filter.type = type;
    }

    if (
      visibility === "public" ||
      visibility === "private"
    ) {
      filter.visibility = visibility;
    }

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate(
          "owner",
          "name username avatar"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Video.countDocuments(filter),
    ]);

    return res.json({
      success: true,

      videos,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// HIDE / UNHIDE VIDEO
// =====================================================

export const toggleVideoVisibility = async (
  req,
  res,
  next
) => {
  try {
    const video = await Video.findById(
      req.params.id
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    video.visibility =
      video.visibility === "public"
        ? "private"
        : "public";

    await video.save();

    return res.json({
      success: true,

      visibility: video.visibility,

      message:
        video.visibility === "public"
          ? "Video made public."
          : "Video hidden successfully.",
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// DELETE VIDEO
// =====================================================

export const deleteAdminVideo = async (
  req,
  res,
  next
) => {
  try {
    const video = await Video.findById(
      req.params.id
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    if (video.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(
          video.cloudinaryPublicId,
          {
            resource_type: "video",
          }
        );
      } catch (cloudinaryError) {
        console.error(
          "Cloudinary delete error:",
          cloudinaryError.message
        );
      }
    }

    await Comment.deleteMany({
      video: video._id,
    });

    await VideoLike.deleteMany({
      video: video._id,
    });

    await video.deleteOne();

    return res.json({
      success: true,
      message: "Video deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET COMMENTS
// =====================================================

export const getAdminComments = async (
  req,
  res,
  next
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find()
        .populate(
          "user",
          "name username avatar"
        )
        .populate(
          "video",
          "title type"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Comment.countDocuments(),
    ]);

    return res.json({
      success: true,

      comments,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// DELETE COMMENT
// =====================================================

export const deleteAdminComment = async (
  req,
  res,
  next
) => {
  try {
    const comment = await Comment.findById(
      req.params.id
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    await comment.deleteOne();

    await Video.findByIdAndUpdate(
      comment.video,
      {
        $inc: {
          commentsCount: -1,
        },
      }
    );

    await Video.updateOne(
      {
        _id: comment.video,
        commentsCount: {
          $lt: 0,
        },
      },
      {
        $set: {
          commentsCount: 0,
        },
      }
    );

    return res.json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
// ==========================================
// CHANGE ADMIN PASSWORD
// ==========================================

export const changeAdminPassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    // ========================================
    // PASSWORD LENGTH
    // ========================================

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters.",
      });
    }

    // ========================================
    // CONFIRM PASSWORD
    // ========================================

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password do not match.",
      });
    }

    // ========================================
    // GET ADMIN WITH PASSWORD
    // ========================================

    const admin = await Admin.findById(
      req.admin._id
    ).select("+passwordHash");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    // ========================================
    // CHECK CURRENT PASSWORD
    // ========================================

    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        admin.passwordHash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // ========================================
    // PREVENT SAME PASSWORD
    // ========================================

    const samePassword =
      await bcrypt.compare(
        newPassword,
        admin.passwordHash
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password.",
      });
    }

    // ========================================
    // HASH NEW PASSWORD
    // ========================================

    const newPasswordHash =
      await bcrypt.hash(newPassword, 12);

    // ========================================
    // UPDATE PASSWORD
    // ========================================

    admin.passwordHash = newPasswordHash;

    await admin.save();

    return res.status(200).json({
      success: true,
      message:
        "Admin password changed successfully.",
    });
  } catch (error) {
    console.error(
      "CHANGE ADMIN PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to change admin password.",
    });
  }
};