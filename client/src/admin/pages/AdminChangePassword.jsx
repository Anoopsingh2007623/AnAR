import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import {
  changeAdminPassword,
} from "../../services/adminApi";

import "../admin.css";

const AdminChangePassword = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // Current password
    if (!currentPassword) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    // New password
    if (!newPassword) {
      setError(
        "Please enter your new password."
      );
      return;
    }

    // Password length
    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    // Confirm password
    if (!confirmPassword) {
      setError(
        "Please confirm your new password."
      );
      return;
    }

    // Match
    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await changeAdminPassword(
          currentPassword,
          newPassword,
          confirmPassword
        );

      setMessage(
        response?.data?.message ||
          "Password changed successfully."
      );

      // Clear fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // After password change logout
      setTimeout(() => {
        localStorage.removeItem(
          "anar_admin_token"
        );

        localStorage.removeItem(
          "anar_admin"
        );

        navigate("/admin/login", {
          replace: true,
        });
      }, 1500);
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-password-page">

      {/* Header */}

      <div className="admin-page-header">

        <div>
          <h1>
            Change Password
          </h1>

          <p>
            Update your admin account password.
          </p>
        </div>

      </div>

      {/* Card */}

      <div className="admin-password-card">

        <div className="admin-password-icon">
          <ShieldCheck size={32} />
        </div>

        <h2>
          Update Admin Password
        </h2>

        <p className="admin-password-description">
          For security, enter your current password
          before creating a new one.
        </p>

        {/* Success */}

        {message && (
          <div className="admin-success">
            {message}
            <br />
            Redirecting to login...
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Current Password */}

          <div className="admin-input-group">

            <label>
              Current Password
            </label>

            <div className="admin-input-wrapper">

              <Lock size={19} />

              <input
                type={
                  showCurrent
                    ? "text"
                    : "password"
                }
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(
                    e.target.value
                  )
                }
                disabled={loading}
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowCurrent(
                    (prev) => !prev
                  )
                }
              >
                {showCurrent ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>

            </div>

          </div>

          {/* New Password */}

          <div className="admin-input-group">

            <label>
              New Password
            </label>

            <div className="admin-input-wrapper">

              <Lock size={19} />

              <input
                type={
                  showNew
                    ? "text"
                    : "password"
                }
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                disabled={loading}
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowNew(
                    (prev) => !prev
                  )
                }
              >
                {showNew ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>

            </div>

            <small className="admin-password-hint">
              Minimum 8 characters
            </small>

          </div>

          {/* Confirm Password */}

          <div className="admin-input-group">

            <label>
              Confirm New Password
            </label>

            <div className="admin-input-wrapper">

              <Lock size={19} />

              <input
                type={
                  showConfirm
                    ? "text"
                    : "password"
                }
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                disabled={loading}
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowConfirm(
                    (prev) => !prev
                  )
                }
              >
                {showConfirm ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>

            </div>

          </div>

          {/* Buttons */}

          <div className="admin-password-actions">

            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() =>
                navigate(
                  "/admin/dashboard"
                )
              }
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loading}
            >
              {loading
                ? "Updating..."
                : "Change Password"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AdminChangePassword;