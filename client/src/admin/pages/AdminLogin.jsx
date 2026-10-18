import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import { adminLogin } from "../../services/adminApi";

import "../admin.css";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // LOGIN
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Email validation
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    // Password validation
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await adminLogin(
        email.trim(),
        password
      );

      const data = response?.data;

      // Token check
      if (!data?.token) {
        throw new Error(
          data?.message ||
            "Invalid admin login response."
        );
      }

      // ========================================
      // SAVE ADMIN TOKEN
      // ========================================

      localStorage.setItem(
        "anar_admin_token",
        data.token
      );

      // ========================================
      // SAVE ADMIN DATA
      // ========================================

      localStorage.setItem(
        "anar_admin",
        JSON.stringify(data.admin || {})
      );

      // ========================================
      // DASHBOARD
      // ========================================

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Invalid admin credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        {/* Icon */}

        <div className="admin-login-icon">
          <ShieldCheck size={38} />
        </div>

        {/* Title */}

        <h1>AnAR Admin</h1>

        <p className="admin-login-subtitle">
          Sign in to manage your platform
        </p>

        {/* Error */}

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {/* Form */}

        <form onSubmit={handleSubmit}>

          {/* Email */}

          <div className="admin-input-group">
            <label htmlFor="admin-email">
              Email
            </label>

            <div className="admin-input-wrapper">

              <Mail size={19} />

              <input
                id="admin-email"
                type="email"
                placeholder="Admin email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                disabled={loading}
              />

            </div>
          </div>

          {/* Password */}

          <div className="admin-input-group">
            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-input-wrapper">

              <Lock size={19} />

              <input
                id="admin-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Admin password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>

            </div>
          </div>

          {/* Login Button */}

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

        {/* Footer */}

        <div className="admin-login-footer">
          AnAR Administration
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;