import { useRef, useState } from "react";
import {
  Upload,
  Video,
  Clapperboard,
  X,
  CheckCircle2,
  Loader2,
  FileVideo,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024;

function Create() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [type, setType] = useState("long");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [videoInfo, setVideoInfo] = useState(null);

  // =========================================================
  // CHECK VIDEO DIMENSIONS
  // =========================================================

  const getVideoDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");

      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;

        URL.revokeObjectURL(url);

        resolve({
          width,
          height,
          duration,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(
          new Error(
            "Unable to read video information."
          )
        );
      };

      video.src = url;
    });
  };

  // =========================================================
  // CHECK 9:16 SHORT
  // =========================================================

  const isVerticalShort = (width, height) => {
    if (!width || !height) return false;

    const ratio = width / height;
    const targetRatio = 9 / 16;

    // Small tolerance for videos such as
    // 1080x1920, 720x1280, 1088x1920 etc.
    const tolerance = 0.04;

    return (
      Math.abs(ratio - targetRatio) <= tolerance
    );
  };

  // =========================================================
  // SELECT VIDEO
  // =========================================================

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess(false);
    setUploadProgress(0);
    setVideoInfo(null);

    // File type
    if (!file.type.startsWith("video/")) {
      setError(
        "Please select a valid video file."
      );

      event.target.value = "";
      return;
    }

    // 5GB limit
    if (file.size > MAX_VIDEO_SIZE) {
      setError(
        "Video size cannot exceed 5 GB."
      );

      event.target.value = "";
      return;
    }

    try {
      // Read video metadata
      const metadata =
        await getVideoDimensions(file);

      setVideoInfo(metadata);

      // If user selected Short
      if (type === "short") {
        const validVertical = isVerticalShort(
          metadata.width,
          metadata.height
        );

        if (!validVertical) {
          setError(
            `Short video must be vertical 9:16. Current video is ${metadata.width}×${metadata.height}.`
          );

          event.target.value = "";
          return;
        }
      }

      // Remove old object URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = URL.createObjectURL(file);

      setVideoFile(file);
      setPreviewUrl(url);
    } catch (err) {
      console.error(
        "Video metadata error:",
        err
      );

      setError(
        "Unable to read this video. Please select another video."
      );

      event.target.value = "";
    }
  };

  // =========================================================
  // CHANGE CONTENT TYPE
  // =========================================================

  const handleTypeChange = async (newType) => {
    setError("");
    setType(newType);

    // If no video selected, just change type
    if (!videoFile) {
      return;
    }

    // Switching to Short
    if (newType === "short") {
      try {
        const metadata =
          await getVideoDimensions(videoFile);

        setVideoInfo(metadata);

        const validVertical = isVerticalShort(
          metadata.width,
          metadata.height
        );

        if (!validVertical) {
          setError(
            "This video is not 9:16. Please select a vertical 9:16 video for Shorts."
          );
        }
      } catch {
        setError(
          "Unable to check video dimensions."
        );
      }
    }
  };

  // =========================================================
  // REMOVE VIDEO
  // =========================================================

  const removeVideo = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setVideoFile(null);
    setPreviewUrl("");
    setVideoInfo(null);
    setUploadProgress(0);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // PUBLISH
  // =========================================================

  const handlePublish = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!videoFile) {
      setError(
        "Please select a video first."
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Please enter a video title."
      );
      return;
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      setError(
        "Video size cannot exceed 5 GB."
      );
      return;
    }

    // =======================================================
    // SHORT VALIDATION
    // =======================================================

    if (type === "short") {
      try {
        const metadata =
          await getVideoDimensions(videoFile);

        setVideoInfo(metadata);

        if (
          !isVerticalShort(
            metadata.width,
            metadata.height
          )
        ) {
          setError(
            `Short video must be 9:16 vertical. Current video is ${metadata.width}×${metadata.height}.`
          );
          return;
        }
      } catch {
        setError(
          "Unable to validate Short video dimensions."
        );
        return;
      }
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      // =====================================================
      // UPLOAD FILE
      // =====================================================

      const formData = new FormData();

      formData.append(
        "video",
        videoFile
      );

      const uploadResponse =
        await API.post(
          "/videos/upload",
          formData,
          {
            // IMPORTANT:
            // Do NOT manually set Content-Type.
            // Axios/browser will automatically add
            // multipart boundary.

            maxContentLength:
              Infinity,

            maxBodyLength:
              Infinity,

            timeout: 0,

            onUploadProgress:
              (progressEvent) => {
                if (
                  progressEvent.total
                ) {
                  const percent =
                    Math.round(
                      (progressEvent.loaded /
                        progressEvent.total) *
                        100
                    );

                  setUploadProgress(
                    percent
                  );
                }
              },
          }
        );

      if (
        !uploadResponse.data?.success
      ) {
        throw new Error(
          uploadResponse.data?.message ||
            "Video upload failed."
        );
      }

      const uploadedVideo =
        uploadResponse.data.video;

      if (!uploadedVideo?.videoUrl) {
        throw new Error(
          "Video URL was not returned by server."
        );
      }

      setUploadProgress(100);

      // =====================================================
      // CREATE DATABASE RECORD
      // =====================================================

      const createResponse =
        await API.post(
          "/videos",
          {
            title: title.trim(),

            description:
              description.trim(),

            videoUrl:
              uploadedVideo.videoUrl,

            thumbnailUrl:
              uploadedVideo.thumbnailUrl ||
              "",

            cloudinaryPublicId:
              uploadedVideo.cloudinaryPublicId ||
              "",

            duration:
              uploadedVideo.duration || 0,

            // VERY IMPORTANT
            // short -> Shorts feed
            // long  -> Home feed
            type: type,

            visibility: "public",
          }
        );

      if (
        !createResponse.data?.success
      ) {
        throw new Error(
          createResponse.data?.message ||
            "Video publishing failed."
        );
      }

      setSuccess(true);

      // =====================================================
      // REDIRECT
      // =====================================================

      setTimeout(() => {
        if (type === "short") {
          navigate("/shorts");
        } else {
          navigate("/");
        }
      }, 1200);
    } catch (err) {
      console.error(
        "AnAR upload error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Video upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FILE SIZE FORMAT
  // =========================================================

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return (
        (bytes / 1024).toFixed(1) +
        " KB"
      );
    }

    if (
      bytes <
      1024 * 1024 * 1024
    ) {
      return (
        (
          bytes /
          (1024 * 1024)
        ).toFixed(1) +
        " MB"
      );
    }

    return (
      (
        bytes /
        (1024 * 1024 * 1024)
      ).toFixed(2) +
      " GB"
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="create-page">

      {/* HEADER */}

      <div className="create-header">
        <div className="create-header-content">

          <div className="create-title-icon">
            <Upload size={22} />
          </div>

          <div>
            <h1>Create</h1>

            <p>
              Share your content with AnAR
            </p>
          </div>

        </div>
      </div>

      <form
        className="create-form"
        onSubmit={handlePublish}
      >

        {/* ===================================================
            UPLOAD
        =================================================== */}

        <section className="create-section">

          <div className="section-title">

            <div>
              <h2>Upload video</h2>

              <p>
                Upload videos up to 5 GB.
              </p>
            </div>

            <span className="section-limit">
              MAX 5 GB
            </span>

          </div>

          {!videoFile ? (
            <button
              type="button"
              className="upload-box"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <div className="upload-icon">
                <Upload size={30} />
              </div>

              <h3>
                Upload a video
              </h3>

              <p>
                Click to select a video
                from your device
              </p>

              <span className="upload-limit">
                Maximum file size: 5 GB
              </span>
            </button>
          ) : (
            <div className="video-preview-box">

              <video
                src={previewUrl}
                controls
                playsInline
                className={
                  type === "short"
                    ? "short-upload-preview"
                    : "long-upload-preview"
                }
              />

              <div className="selected-video-info">

                <div className="selected-video-left">

                  <div className="file-icon">
                    <FileVideo size={19} />
                  </div>

                  <div className="selected-file-details">

                    <strong>
                      {videoFile.name}
                    </strong>

                    <span>
                      {formatSize(
                        videoFile.size
                      )}
                    </span>

                    {videoInfo && (
                      <small>
                        {videoInfo.width} ×{" "}
                        {videoInfo.height}
                        {" • "}
                        {Math.round(
                          videoInfo.duration || 0
                        )}s
                      </small>
                    )}

                  </div>
                </div>

                <button
                  type="button"
                  className="remove-video"
                  onClick={removeVideo}
                  disabled={loading}
                >
                  <X size={18} />
                </button>

              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={handleFileChange}
          />

          {/* PROGRESS */}

          {loading && (
            <div className="upload-progress">

              <div className="progress-top">

                <span>
                  Uploading video...
                </span>

                <strong>
                  {uploadProgress}%
                </strong>

              </div>

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${uploadProgress}%`,
                  }}
                />

              </div>

              <p>
                Large videos may take
                some time to upload.
              </p>

            </div>
          )}

        </section>

        {/* ===================================================
            TYPE
        =================================================== */}

        <section className="create-section">

          <div className="section-title">

            <div>
              <h2>Content type</h2>

              <p>
                Choose how you want
                to publish.
              </p>
            </div>

          </div>

          <div className="content-type-grid">

            {/* LONG */}

            <button
              type="button"
              className={
                type === "long"
                  ? "content-type-card active"
                  : "content-type-card"
              }
              onClick={() =>
                handleTypeChange("long")
              }
              disabled={loading}
            >

              <div className="type-icon">
                <Video size={23} />
              </div>

              <div className="type-content">

                <strong>
                  Long Video
                </strong>

                <p>
                  Normal video for
                  Home feed.
                </p>

              </div>

              {type === "long" && (
                <CheckCircle2
                  size={20}
                  className="type-check"
                />
              )}

            </button>

            {/* SHORT */}

            <button
              type="button"
              className={
                type === "short"
                  ? "content-type-card active"
                  : "content-type-card"
              }
              onClick={() =>
                handleTypeChange("short")
              }
              disabled={loading}
            >

              <div className="type-icon">
                <Clapperboard size={23} />
              </div>

              <div className="type-content">

                <strong>
                  Short
                </strong>

                <p>
                  Vertical 9:16 video
                  for Shorts feed.
                </p>

              </div>

              {type === "short" && (
                <CheckCircle2
                  size={20}
                  className="type-check"
                />
              )}

            </button>

          </div>

          {/* SHORT FORMAT INFO */}

          {type === "short" && (
            <div className="short-format-info">
              <strong>
                Shorts format: 9:16
              </strong>

              <span>
                Recommended: 1080 × 1920
              </span>
            </div>
          )}

        </section>

        {/* ===================================================
            DETAILS
        =================================================== */}

        <section className="create-section">

          <div className="section-title">

            <div>
              <h2>Video details</h2>

              <p>
                Add information
                about your video.
              </p>
            </div>

          </div>

          <div className="form-field">

            <label htmlFor="video-title">
              Title
            </label>

            <input
              id="video-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Enter your video title"
              maxLength={150}
              disabled={loading}
            />

            <span className="character-count">
              {title.length}/150
            </span>

          </div>

          <div className="form-field">

            <label htmlFor="video-description">
              Description
            </label>

            <textarea
              id="video-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Tell viewers about your video..."
              maxLength={5000}
              rows={7}
              disabled={loading}
            />

            <span className="character-count textarea-count">
              {description.length}/5000
            </span>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="create-message error">
            <X size={19} />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="create-message success">

            <CheckCircle2 size={20} />

            <span>
              {type === "short"
                ? "Short published successfully! Opening Shorts..."
                : "Video published successfully!"}
            </span>

          </div>
        )}

        {/* PUBLISH */}

        <div className="publish-area">

          <button
            type="submit"
            className="publish-button"
            disabled={
              loading ||
              !videoFile ||
              !title.trim()
            }
          >
            {loading ? (
              <>
                <Loader2
                  size={19}
                  className="publish-spinner"
                />

                Uploading{" "}
                {uploadProgress}%
              </>
            ) : (
              <>
                <Upload size={18} />

                {type === "short"
                  ? "Publish Short"
                  : "Publish on AnAR"}
              </>
            )}
          </button>

        </div>

      </form>
    </main>
  );
}

export default Create;