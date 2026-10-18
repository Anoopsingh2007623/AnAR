import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    // =====================================================
    // OWNER
    // =====================================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // TITLE
    // =====================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // =====================================================
    // DESCRIPTION
    // =====================================================

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    // =====================================================
    // VIDEO URL
    // =====================================================

    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // THUMBNAIL
    // =====================================================

    thumbnailUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // CLOUDINARY PUBLIC ID
    // =====================================================

    cloudinaryPublicId: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // VIDEO DURATION
    // =====================================================

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // VIDEO TYPE
    //
    // long  = Normal/Home video
    // short = Shorts
    //
    // IMPORTANT:
    // A video can belong to ONLY ONE type.
    // =====================================================

    type: {
      type: String,
      enum: ["long", "short"],
      required: true,
      index: true,
    },

    // =====================================================
    // VIEWS
    // =====================================================

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // LIKES
    // =====================================================

    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // COMMENTS
    // =====================================================

    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // SHARES
    // =====================================================

    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // VISIBILITY
    // =====================================================

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

// User + video type + latest videos
//
// Useful for:
// /videos/my?type=long
// /videos/my?type=short
//
videoSchema.index({
  owner: 1,
  type: 1,
  createdAt: -1,
});

// Public + video type + latest videos
//
// Useful for:
// /videos?type=long
// /videos?type=short
//
videoSchema.index({
  visibility: 1,
  type: 1,
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const Video = mongoose.model("Video", videoSchema);

export default Video;