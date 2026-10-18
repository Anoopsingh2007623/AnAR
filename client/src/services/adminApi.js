import axios from "axios";

const ADMIN_API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 0,
});

// ==========================================
// REQUEST
// ==========================================

ADMIN_API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "anar_admin_token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE
// ==========================================

ADMIN_API.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    const token =
      localStorage.getItem(
        "anar_admin_token"
      );

    const currentPath =
      window.location.pathname;

    const isAdminPage =
      currentPath.startsWith("/admin");

    const isLoginPage =
      currentPath === "/admin/login";

    // Invalid/expired admin token
    if (
      token &&
      isAdminPage &&
      !isLoginPage &&
      (status === 401 ||
        status === 403)
    ) {
      localStorage.removeItem(
        "anar_admin_token"
      );

      localStorage.removeItem(
        "anar_admin"
      );

      window.location.replace(
        "/admin/login"
      );
    }

    return Promise.reject(error);
  }
);

// ==========================================
// LOGIN
// ==========================================

export const adminLogin = (
  email,
  password
) => {
  return ADMIN_API.post(
    "/admin/login",
    {
      email,
      password,
    }
  );
};

// ==========================================
// PROFILE
// ==========================================

export const getAdminProfile = () => {
  return ADMIN_API.get(
    "/admin/me"
  );
};

// ==========================================
// DASHBOARD
// ==========================================

export const getAdminDashboard = () => {
  return ADMIN_API.get(
    "/admin/dashboard"
  );
};

// ==========================================
// USERS
// ==========================================

export const getAdminUsers = (
  params = {}
) => {
  return ADMIN_API.get(
    "/admin/users",
    {
      params,
    }
  );
};

export const toggleAdminUserBlock = (
  userId
) => {
  return ADMIN_API.patch(
    `/admin/users/${userId}/block`
  );
};

export const deleteAdminUser = (
  userId
) => {
  return ADMIN_API.delete(
    `/admin/users/${userId}`
  );
};

// ==========================================
// VIDEOS
// ==========================================

export const getAdminVideos = (
  params = {}
) => {
  return ADMIN_API.get(
    "/admin/videos",
    {
      params,
    }
  );
};

export const toggleAdminVideoVisibility = (
  videoId
) => {
  return ADMIN_API.patch(
    `/admin/videos/${videoId}/visibility`
  );
};

export const deleteAdminVideo = (
  videoId
) => {
  return ADMIN_API.delete(
    `/admin/videos/${videoId}`
  );
};

// ==========================================
// COMMENTS
// ==========================================

export const getAdminComments = (
  params = {}
) => {
  return ADMIN_API.get(
    "/admin/comments",
    {
      params,
    }
  );
};

export const deleteAdminComment = (
  commentId
) => {
  return ADMIN_API.delete(
    `/admin/comments/${commentId}`
  );
};
// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changeAdminPassword = (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  return ADMIN_API.patch(
    "/admin/password",
    {
      currentPassword,
      newPassword,
      confirmPassword,
    }
  );
};

export default ADMIN_API;