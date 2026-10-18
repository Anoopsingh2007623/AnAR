import mongoose from "mongoose";

const videoLikeSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same user ek video ko ek hi baar like kar sake
videoLikeSchema.index(
  { video: 1, user: 1 },
  { unique: true }
);

export default mongoose.model("VideoLike", videoLikeSchema);