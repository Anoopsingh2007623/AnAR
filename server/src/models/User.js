import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    passwordHash: {
      type: String,
      select: false
    },

    avatar: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: "",
      maxlength: 160
    },

    followersCount: {
      type: Number,
      default: 0
    },

    followingCount: {
      type: Number,
      default: 0
    },

    accountType: {
      type: String,
      enum: ["normal", "professional"],
      default: "normal"
    },

    monetization: {
      followers: {
        type: Number,
        default: 0
      },

      watchHours: {
        type: Number,
        default: 0
      },

      eligible: {
        type: Boolean,
        default: false
      },

      approved: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);