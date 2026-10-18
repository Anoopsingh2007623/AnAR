import axios from "axios";

// =====================================================
// AXIOS API INSTANCE
// =====================================================

const API = axios.create({
 baseURL: "http://192.168.1.7:5000/api",

  // Large video upload ke liye timeout disabled
  timeout: 0,
});

// =====================================================
// AUTH TOKEN INTERCEPTOR
// =====================================================

API.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("skillsetu_token");

      console.log(
        "🔑 Token available:",
        token ? "YES" : "NO"
      );

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error(
        "❌ Token interceptor error:",
        error
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE ERROR INTERCEPTOR
// =====================================================

API.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    console.error("❌ API ERROR");

    if (error.response) {
      console.error(
        "Status:",
        error.response.status
      );

      console.error(
        "Response:",
        error.response.data
      );

      // Unauthorized
      if (error.response.status === 401) {
        console.warn(
          "⚠️ Authentication expired or invalid token."
        );
      }

      // Blocked user
      if (error.response.status === 403) {
        console.warn(
          "🚫 Access denied:",
          error.response.data?.message
        );
      }
    } else if (error.request) {
      console.error(
        "❌ No response received from server"
      );
    } else {
      console.error(
        "❌ Request error:",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

// =====================================================
// PROFILE
// =====================================================

export const getMyProfile = () => {
  return API.get("/users/me");
};

export const updateMyProfile = (data) => {
  return API.put("/users/me", data);
};

// =====================================================
// FOLLOW USER
// =====================================================

export const followUser = (userId) => {
  if (!userId) {
    return Promise.reject(
      new Error("User ID is required.")
    );
  }

  return API.post(
    `/users/${userId}/follow`
  );
};

// =====================================================
// UNFOLLOW USER
// =====================================================

export const unfollowUser = (userId) => {
  if (!userId) {
    return Promise.reject(
      new Error("User ID is required.")
    );
  }

  return API.delete(
    `/users/${userId}/follow`
  );
};

// =====================================================
// FOLLOW STATUS
// =====================================================

export const getFollowStatus = (userId) => {
  if (!userId) {
    return Promise.reject(
      new Error("User ID is required.")
    );
  }

  return API.get(
    `/users/${userId}/follow-status`
  );
};

// =====================================================
// VIDEO FILE UPLOAD
// =====================================================

export const uploadVideoFile = (
  file,
  onUploadProgress
) => {
  if (!file) {
    return Promise.reject(
      new Error("No video file selected.")
    );
  }

  const formData = new FormData();

  formData.append(
    "video",
    file
  );

  console.log(
    "======================================"
  );

  console.log(
    "📤 VIDEO UPLOAD START"
  );

  console.log(
    "======================================"
  );

  console.log(
    "📁 File:",
    file.name
  );

  console.log(
    "📦 Size:",
    (
      file.size /
      1024 /
      1024
    ).toFixed(2),
    "MB"
  );

  console.log(
    "🎬 Type:",
    file.type
  );

  return API.post(
    "/videos/upload",
    formData,
    {
      // Large upload ke liye timeout disabled
      timeout: 0,

      // Browser automatically
      // multipart/form-data boundary set karega
      headers: {
        Accept: "application/json",
      },

      // Upload progress
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) {
          console.log(
            "📤 Uploading..."
          );

          return;
        }

        const progress = Math.round(
          (progressEvent.loaded * 100) /
            progressEvent.total
        );

        console.log(
          `📤 Browser → Server: ${progress}%`
        );

        if (
          typeof onUploadProgress ===
          "function"
        ) {
          onUploadProgress(progress);
        }
      },

      // Large request support
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );
};

// =====================================================
// CREATE VIDEO RECORD
// =====================================================

export const createVideo = (data) => {
  return API.post(
    "/videos",
    data
  );
};

// =====================================================
// GET MY VIDEOS
// =====================================================

export const getMyVideos = (type) => {
  const url = type
    ? `/videos/my?type=${encodeURIComponent(
        type
      )}`
    : "/videos/my";

  return API.get(url);
};

// =====================================================
// GET PUBLIC VIDEOS
// =====================================================

export const getPublicVideos = (type) => {
  const url = type
    ? `/videos?type=${encodeURIComponent(
        type
      )}`
    : "/videos";

  return API.get(url);
};

// =====================================================
// GET USER VIDEOS
// =====================================================

export const getUserVideos = (
  userId,
  type
) => {
  if (!userId) {
    return Promise.reject(
      new Error(
        "User ID is required."
      )
    );
  }

  const url = type
    ? `/videos/user/${userId}?type=${encodeURIComponent(
        type
      )}`
    : `/videos/user/${userId}`;

  return API.get(url);
};

// =====================================================
// GET SINGLE VIDEO
// =====================================================

export const getVideo = (videoId) => {
  if (!videoId) {
    return Promise.reject(
      new Error(
        "Video ID is required."
      )
    );
  }

  return API.get(
    `/videos/${videoId}`
  );
};

// =====================================================
// DELETE VIDEO
// =====================================================

export const deleteVideo = (videoId) => {
  if (!videoId) {
    return Promise.reject(
      new Error(
        "Video ID is required."
      )
    );
  }

  return API.delete(
    `/videos/${videoId}`
  );
};

// =====================================================
// LIKE / UNLIKE VIDEO
// =====================================================

export const toggleVideoLike = (
  videoId
) => {
  if (!videoId) {
    return Promise.reject(
      new Error(
        "Video ID is required."
      )
    );
  }

  return API.post(
    `/videos/${videoId}/like`
  );
};

// =====================================================
// GET VIDEO LIKE STATUS
// =====================================================

export const getVideoLikeStatus = (
  videoId
) => {
  if (!videoId) {
    return Promise.reject(
      new Error(
        "Video ID is required."
      )
    );
  }

  return API.get(
    `/videos/${videoId}/like`
  );
};

// =====================================================
// GET VIDEO COMMENTS
// =====================================================

export const getVideoComments = (
  videoId
) => {
  if (!videoId) {
    return Promise.reject(
      new Error(
        "Video ID is required."
      )
    );
  }

  return API.get(
    `/videos/${videoId}/comments`
  );
};

// =====================================================
// ADD VIDEO COMMENT
// =====================================================

export const addVideoComment = (
  videoId,
  text
) => {
  if (!videoId) {
    return Promise.reject(
      new Error(
        "Video ID is required."
      )
    );
  }

  if (!text || !text.trim()) {
    return Promise.reject(
      new Error(
        "Comment cannot be empty."
      )
    );
  }

  return API.post(
    `/videos/${videoId}/comments`,
    {
      text: text.trim(),
    }
  );
};

// =====================================================
// REGISTER VIDEO VIEW
// =====================================================
//
// POST /api/videos/:id/view
//
// Video ko genuinely watch karne par
// VideoPage / Shorts is function ko call karega.
//
// Backend views ko +1 karega.
//
// =====================================================

export const registerVideoView = (
  videoId
) => {
  if (!videoId) {
    return Promise.reject(
      new Error(
        "Video ID is required."
      )
    );
  }

  return API.post(
    `/videos/${videoId}/view`
  );
};

// =====================================================
// DEFAULT API
// =====================================================

export default API;