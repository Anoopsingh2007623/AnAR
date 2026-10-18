import fs from "fs";

import cloudinary from "../config/cloudinary.js";
import Video from "../models/Video.js";
import VideoLike from "../models/VideoLike.js";
import Comment from "../models/Comment.js";
/* =====================================================
   CLOUDINARY LARGE VIDEO UPLOAD
   ===================================================== */

const uploadLargeVideo = (filePath) => {
  return new Promise((resolve, reject) => {
    console.log("");
    console.log("======================================");
    console.log("☁️ CLOUDINARY UPLOAD START");
    console.log("======================================");
    console.log("File:", filePath);
    console.log("Chunk size: 20 MB");
    console.log("======================================");

    let settled = false;

    const finishResolve = (result) => {
      if (settled) return;

      settled = true;

      console.log("");
      console.log("✅ Cloudinary upload completed");

      resolve(result);
    };

    const finishReject = (error) => {
      if (settled) return;

      settled = true;

      console.error("");
      console.error("❌ Cloudinary upload failed");
      console.error(error);

      reject(error);
    };

    try {
      const uploadStream =
        cloudinary.uploader.upload_large(
          filePath,
          {
            resource_type: "video",
            folder: "anar/videos",
            chunk_size: 20 * 1024 * 1024,
          },
          (error, result) => {
            if (error) {
              finishReject(error);
              return;
            }

            if (!result) {
              finishReject(
                new Error(
                  "Cloudinary returned empty result."
                )
              );
              return;
            }

            console.log(
              "✅ Cloudinary callback received"
            );

            console.log(
              "Public ID:",
              result.public_id
            );

            console.log(
              "Secure URL:",
              result.secure_url
            );

            finishResolve(result);
          }
        );

      /* =====================================================
         STREAM ERROR
         ===================================================== */

      if (
        uploadStream &&
        typeof uploadStream.on === "function"
      ) {
        uploadStream.on(
          "error",
          (error) => {
            console.error(
              "❌ Cloudinary stream error:"
            );

            console.error(error);

            finishReject(error);
          }
        );
      }

      console.log(
        "🚀 Cloudinary upload request sent..."
      );
    } catch (error) {
      finishReject(error);
    }
  });
};

/* =====================================================
   UPLOAD VIDEO
   ===================================================== */

export const uploadVideo = async (
  req,
  res,
  next
) => {
  let filePath = null;

  try {
    /* =====================================================
       AUTH
       ===================================================== */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /* =====================================================
       FILE CHECK
       ===================================================== */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a video.",
      });
    }

    filePath = req.file.path;

    /* =====================================================
       FILE INFORMATION
       ===================================================== */

    console.log("");
    console.log("======================================");
    console.log("🎬 ANAR VIDEO UPLOAD");
    console.log("======================================");

    console.log(
      "File:",
      req.file.originalname
    );

    console.log(
      "Mimetype:",
      req.file.mimetype
    );

    console.log(
      "Size:",
      (
        req.file.size /
        (1024 * 1024 * 1024)
      ).toFixed(2),
      "GB"
    );

    console.log(
      "Temporary path:",
      filePath
    );

    /* =====================================================
       VERIFY TEMP FILE
       ===================================================== */

    if (!fs.existsSync(filePath)) {
      throw new Error(
        "Temporary uploaded file was not found."
      );
    }

    const stats =
      fs.statSync(filePath);

    console.log(
      "Temporary file size:",
      (
        stats.size /
        (1024 * 1024)
      ).toFixed(2),
      "MB"
    );

    /* =====================================================
       CLOUDINARY
       ===================================================== */

    console.log("");
    console.log(
      "☁️ Uploading to Cloudinary in chunks..."
    );

    const result =
      await uploadLargeVideo(
        filePath
      );

    /* =====================================================
       CHECK CLOUDINARY RESULT
       ===================================================== */

    if (
      !result ||
      !result.secure_url
    ) {
      throw new Error(
        "Cloudinary upload completed but no secure URL was returned."
      );
    }

    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "✅ CLOUDINARY UPLOAD SUCCESS"
    );
    console.log(
      "======================================"
    );

    console.log(
      "Public ID:",
      result.public_id
    );

    console.log(
      "URL:",
      result.secure_url
    );

    console.log(
      "Format:",
      result.format
    );

    console.log(
      "Duration:",
      result.duration || 0
    );

    console.log(
      "Size:",
      result.bytes || req.file.size
    );

    /* =====================================================
       DELETE TEMP FILE
       ===================================================== */

    try {
      if (
        filePath &&
        fs.existsSync(filePath)
      ) {
        fs.unlinkSync(filePath);

        console.log(
          "🗑️ Temporary file deleted."
        );
      }
    } catch (deleteError) {
      console.error(
        "⚠️ Temporary file cleanup error:",
        deleteError
      );
    }

    filePath = null;

    /* =====================================================
       CREATE THUMBNAIL URL
       ===================================================== */

    let thumbnailUrl = "";

    if (result.secure_url) {
      thumbnailUrl =
        result.secure_url
          .replace(
            "/upload/",
            "/upload/so_0/"
          )
          .replace(
            /\.[^/.]+$/,
            ".jpg"
          );
    }

    /* =====================================================
       RESPONSE
       ===================================================== */

    return res.status(200).json({
      success: true,

      message:
        "Video uploaded successfully.",

      video: {
        videoUrl:
          result.secure_url,

        thumbnailUrl,

        cloudinaryPublicId:
          result.public_id,

        publicId:
          result.public_id,

        duration:
          result.duration || 0,

        width:
          result.width || 0,

        height:
          result.height || 0,

        format:
          result.format || "",

        bytes:
          result.bytes ||
          req.file.size,
      },
    });
  } catch (error) {
    console.error("");
    console.error(
      "======================================"
    );
    console.error(
      "❌ VIDEO UPLOAD ERROR"
    );
    console.error(
      "======================================"
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Name:",
      error?.name
    );

    console.error(
      "HTTP Code:",
      error?.http_code
    );

    console.error(
      "Full error:",
      error
    );

    /* =====================================================
       CLEAN TEMP FILE
       ===================================================== */

    try {
      if (
        filePath &&
        fs.existsSync(filePath)
      ) {
        fs.unlinkSync(filePath);

        console.log(
          "🗑️ Temporary file cleaned."
        );
      }
    } catch (cleanupError) {
      console.error(
        "❌ Cleanup failed:",
        cleanupError
      );
    }

    /* =====================================================
       RETURN ERROR
       ===================================================== */

    return res.status(
      error?.http_code || 500
    ).json({
      success: false,

      message:
        error?.message ||
        "Video upload failed.",

      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : error?.message,
    });
  }
};

/* =====================================================
   CREATE VIDEO RECORD
   ===================================================== */

export const createVideo = async (
  req,
  res,
  next
) => {
  try {
    /* =====================================================
       AUTH
       ===================================================== */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      cloudinaryPublicId,
      duration,
      type,
      visibility,
    } = req.body;

    /* =====================================================
       VALIDATE TITLE
       ===================================================== */

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Video title is required.",
      });
    }

    /* =====================================================
       VALIDATE VIDEO URL
       ===================================================== */

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message:
          "Video upload URL is required.",
      });
    }

    /* =====================================================
       STRICT VIDEO TYPE VALIDATION
       
       IMPORTANT:
       type MUST be either long or short.
       
       We do NOT silently convert invalid type
       into long.
       ===================================================== */

    if (
      type !== "long" &&
      type !== "short"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Video type must be either 'long' or 'short'.",
      });
    }

    /* =====================================================
       CREATE DATABASE RECORD
       ===================================================== */

    const video =
      await Video.create({
        owner: req.user._id,

        title:
          title.trim(),

        description:
          description?.trim() || "",

        videoUrl,

        thumbnailUrl:
          thumbnailUrl || "",

        cloudinaryPublicId:
          cloudinaryPublicId || "",

        duration:
          Number(duration) || 0,

        /*
          IMPORTANT:
          Exact type from frontend is stored.
        */
        type,

        visibility:
          visibility === "private"
            ? "private"
            : "public",
      });

    /* =====================================================
       POPULATE OWNER
       ===================================================== */

    const populatedVideo =
      await Video.findById(
        video._id
      ).populate(
        "owner",
        "name username avatar followersCount accountType"
      );

    /* =====================================================
       RESPONSE
       ===================================================== */

    return res.status(201).json({
      success: true,

      message:
        "Video published successfully.",

      video: populatedVideo,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   GET PUBLIC VIDEOS
   ===================================================== */

export const getPublicVideos = async (
  req,
  res,
  next
) => {
  try {
    const {
      type,
    } = req.query;

    /* =====================================================
       STRICT TYPE FILTER
       ===================================================== */

    if (
      type &&
      type !== "long" &&
      type !== "short"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid video type.",
      });
    }

    const filter = {
      visibility: "public",
    };

    /*
      If type is provided:
      ONLY that type is returned.
    */

    if (
      type === "long" ||
      type === "short"
    ) {
      filter.type = type;
    }

    const videos =
      await Video.find(filter)
        .populate(
          "owner",
          "name username avatar followersCount accountType"
        )
        .sort({
          createdAt: -1,
        })
        .limit(50);

    return res.json({
      success: true,
      videos,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   GET MY VIDEOS
   ===================================================== */

export const getMyVideos = async (
  req,
  res,
  next
) => {
  try {
    const {
      type,
    } = req.query;

    /* =====================================================
       STRICT TYPE VALIDATION
       ===================================================== */

    if (
      type &&
      type !== "long" &&
      type !== "short"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid video type.",
      });
    }

    const filter = {
      owner: req.user._id,
    };

    /*
      IMPORTANT:
      Profile can now request:

      /videos/my?type=long

      OR

      /videos/my?type=short
    */

    if (
      type === "long" ||
      type === "short"
    ) {
      filter.type = type;
    }

    const videos =
      await Video.find(filter)
        .sort({
          createdAt: -1,
        });

    return res.json({
      success: true,
      videos,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   GET USER VIDEOS
   ===================================================== */

export const getUserVideos = async (
  req,
  res,
  next
) => {
  try {
    const {
      type,
    } = req.query;

    /* =====================================================
       STRICT TYPE VALIDATION
       ===================================================== */

    if (
      type &&
      type !== "long" &&
      type !== "short"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid video type.",
      });
    }

    const filter = {
      owner: req.params.userId,
      visibility: "public",
    };

    /*
      IMPORTANT:
      Public profile can separately request
      long or short videos.
    */

    if (
      type === "long" ||
      type === "short"
    ) {
      filter.type = type;
    }

    const videos =
      await Video.find(filter)
        .populate(
          "owner",
          "name username avatar followersCount accountType"
        )
        .sort({
          createdAt: -1,
        });

    return res.json({
      success: true,
      videos,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   GET SINGLE VIDEO
   ===================================================== */

export const getVideo = async (
  req,
  res,
  next
) => {
  try {
    const video =
      await Video.findById(
        req.params.id
      ).populate(
        "owner",
        "name username avatar followersCount accountType"
      );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    return res.json({
      success: true,
      video,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   DELETE VIDEO
   ===================================================== */

export const deleteVideo = async (
  req,
  res,
  next
) => {
  try {
    const video =
      await Video.findById(
        req.params.id
      );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    /* =====================================================
       CHECK OWNER
       ===================================================== */

    if (
      video.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to delete this video.",
      });
    }

    /* =====================================================
       DELETE FROM CLOUDINARY
       ===================================================== */

    if (
      video.cloudinaryPublicId
    ) {
      try {
        await cloudinary.uploader.destroy(
          video.cloudinaryPublicId,
          {
            resource_type: "video",
          }
        );

        console.log(
          "☁️ Cloudinary video deleted:",
          video.cloudinaryPublicId
        );
      } catch (
        cloudinaryError
      ) {
        console.error(
          "Cloudinary delete error:",
          cloudinaryError
        );
      }
    }

    /* =====================================================
       DELETE DATABASE RECORD
       ===================================================== */

    await video.deleteOne();

    return res.json({
      success: true,
      message:
        "Video deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
// =====================================================
// LIKE / UNLIKE VIDEO
// =====================================================

export const toggleVideoLike = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const videoId = req.params.id;
    const userId = req.user._id;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    const existingLike = await VideoLike.findOne({
      video: videoId,
      user: userId,
    });

    // =========================
    // UNLIKE
    // =========================

    if (existingLike) {
      await existingLike.deleteOne();

      video.likesCount = Math.max(
        0,
        Number(video.likesCount || 0) - 1
      );

      await video.save();

      return res.json({
        success: true,
        liked: false,
        likesCount: video.likesCount,
        message: "Video unliked.",
      });
    }

    // =========================
    // LIKE
    // =========================

    await VideoLike.create({
      video: videoId,
      user: userId,
    });

    video.likesCount =
      Number(video.likesCount || 0) + 1;

    await video.save();

    return res.json({
      success: true,
      liked: true,
      likesCount: video.likesCount,
      message: "Video liked.",
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// CHECK LIKE STATUS
// =====================================================

export const getVideoLikeStatus = async (
  req,
  res,
  next
) => {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        liked: false,
      });
    }

    const existingLike = await VideoLike.findOne({
      video: req.params.id,
      user: req.user._id,
    });

    return res.json({
      success: true,
      liked: !!existingLike,
    });
  } catch (error) {
    next(error);
  }
};
// =====================================================
// ADD COMMENT
// =====================================================

export const addVideoComment = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const videoId = req.params.id;
    const userId = req.user._id;

    const text = req.body?.text?.trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty.",
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 1000 characters.",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    const comment = await Comment.create({
      video: videoId,
      user: userId,
      text,
    });

    video.commentsCount = Number(video.commentsCount || 0) + 1;
    await video.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate(
        "user",
        "name username avatar"
      );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment: populatedComment,
      commentsCount: video.commentsCount,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET COMMENTS
// =====================================================

export const getVideoComments = async (req, res, next) => {
  try {
    const videoId = req.params.id;

    const video = await Video.findById(videoId)
      .select("commentsCount");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    const comments = await Comment.find({
      video: videoId,
    })
      .populate(
        "user",
        "name username avatar"
      )
      .sort({
        createdAt: -1,
      })
      .limit(100);

    return res.json({
      success: true,
      comments,
      commentsCount: video.commentsCount,
    });
  } catch (error) {
    next(error);
  }
};
// =====================================================
// REGISTER VIDEO VIEW
// =====================================================
//
// POST /api/videos/:id/view
//
// Har valid view par views +1 hoga.
// Authentication required nahi hai,
// isliye public user bhi view count kar sakta hai.
// =====================================================

export const registerVideoView = async (
  req,
  res,
  next
) => {
  try {
    const videoId = req.params.id;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required.",
      });
    }

    const video =
      await Video.findByIdAndUpdate(
        videoId,
        {
          $inc: {
            views: 1,
          },
        },
        {
          new: true,
        }
      ).select("_id views");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video view registered.",
      views: video.views,
    });
  } catch (error) {
    next(error);
  }
};