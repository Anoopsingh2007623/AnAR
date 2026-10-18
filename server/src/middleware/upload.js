import multer from "multer";
import path from "path";
import fs from "fs";

// ==========================================
// TEMP UPLOAD DIRECTORY
// ==========================================

const uploadDir = path.resolve("temp-uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ==========================================
// DISK STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension =
      path.extname(file.originalname) || ".mp4";

    const uniqueName =
      `anar-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, uniqueName);
  },
});

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {
  if (!file.mimetype) {
    return cb(
      new Error("Video file type is missing."),
      false
    );
  }

  if (!file.mimetype.startsWith("video/")) {
    return cb(
      new Error(
        "Only video files are allowed."
      ),
      false
    );
  }

  cb(null, true);
};

// ==========================================
// MULTER
// ==========================================

// 5 GiB maximum
const MAX_VIDEO_SIZE =
  5 * 1024 * 1024 * 1024;

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_VIDEO_SIZE,

    // Prevent extremely large field names/fields
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    fields: 20,
    files: 1,
  },

  fileFilter,
});

export default upload;