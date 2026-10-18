import React, {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  getAdminProfile,
} from "../services/adminApi";

const AdminProtectedRoute = () => {
  const [loading, setLoading] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      const token =
        localStorage.getItem(
          "anar_admin_token"
        );

      // =====================================
      // NO TOKEN
      // =====================================

      if (!token) {
        if (mounted) {
          setAuthenticated(false);
          setLoading(false);
        }

        return;
      }

      // =====================================
      // VERIFY TOKEN FROM BACKEND
      // =====================================

      try {
        const response =
          await getAdminProfile();

        if (
          response?.data?.success === false
        ) {
          throw new Error(
            "Admin authentication failed"
          );
        }

        // Save latest admin data
        if (response?.data?.admin) {
          localStorage.setItem(
            "anar_admin",
            JSON.stringify(
              response.data.admin
            )
          );
        }

        if (mounted) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error(
          "Admin authentication failed:",
          error
        );

        // Remove invalid session
        localStorage.removeItem(
          "anar_admin_token"
        );

        localStorage.removeItem(
          "anar_admin"
        );

        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================
  // CHECKING
  // =====================================

  if (loading) {
    return (
      <div className="admin-auth-loading">

        <div className="admin-auth-loading-card">

          <div className="admin-loading-spinner"></div>

          <h3>
            Checking Admin Access...
          </h3>

          <p>
            Please wait
          </p>

        </div>

      </div>
    );
  }

  // =====================================
  // NOT AUTHENTICATED
  // =====================================

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // =====================================
  // AUTHENTICATED
  // =====================================

  return <Outlet />;
};

export default AdminProtectedRoute;