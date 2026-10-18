import { useState } from "react";
import {
  Mail,
  Smartphone,
  Lock,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Auth() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [method, setMethod] = useState("email");

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError("");
  };

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      if (mode === "register") {
        await register({
          name: form.name.trim(),
          username: form.username.trim(),
          email:
            method === "email"
              ? form.email.trim()
              : undefined,
          phone:
            method === "phone"
              ? form.phone.trim()
              : undefined,
          password: form.password,
        });
      } else {
        const identifier =
          method === "email"
            ? form.email.trim()
            : form.phone.trim();

        await login(
          identifier,
          form.password
        );
      }

      // Login/register successful
      window.location.href = "/";
    } catch (err) {
      console.error("Auth error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert(
      "Google OAuth will be connected in the authentication setup."
    );
  };

  return (
    <div className="auth-page">

      {/* Brand */}

      <div className="auth-brand">
        <div className="logo-box">
          A
        </div>

        <span className="auth-brand-name">
          An<span className="logo-highlight">AR</span>
        </span>
      </div>

      {/* Auth Card */}

      <div className="auth-card">

        {/* Heading */}

        <div className="auth-heading">
          <h1>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p>
            {mode === "login"
              ? "Login to continue to AnAR"
              : "Join AnAR and start creating"}
          </p>
        </div>

        {/* Login / Register */}

        <div className="auth-tabs">

          <button
            type="button"
            className={
              mode === "login"
                ? "selected"
                : ""
            }
            onClick={() =>
              handleModeChange("login")
            }
          >
            Login
          </button>

          <button
            type="button"
            className={
              mode === "register"
                ? "selected"
                : ""
            }
            onClick={() =>
              handleModeChange("register")
            }
          >
            Create Account
          </button>

        </div>

        {/* Email / Mobile */}

        <div className="method-tabs">

          <button
            type="button"
            className={
              method === "email"
                ? "method-active"
                : ""
            }
            onClick={() =>
              handleMethodChange("email")
            }
          >
            <Mail size={17} />
            <span>Email</span>
          </button>

          <button
            type="button"
            className={
              method === "phone"
                ? "method-active"
                : ""
            }
            onClick={() =>
              handleMethodChange("phone")
            }
          >
            <Smartphone size={17} />
            <span>Mobile</span>
          </button>

        </div>

        {/* Form */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* Register fields */}

          {mode === "register" && (
            <>
              {/* Name */}

              <div className="input-group">
                <UserRound size={18} />

                <input
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              {/* Username */}

              <div className="input-group">
                <span className="username-icon">
                  @
                </span>

                <input
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  minLength={3}
                  required
                />
              </div>
            </>
          )}

          {/* Email / Mobile */}

          <div className="input-group">

            {method === "email" ? (
              <Mail size={18} />
            ) : (
              <Smartphone size={18} />
            )}

            <input
              name={
                method === "email"
                  ? "email"
                  : "phone"
              }
              type={
                method === "email"
                  ? "email"
                  : "tel"
              }
              placeholder={
                method === "email"
                  ? "Email address"
                  : "Mobile number"
              }
              value={
                method === "email"
                  ? form.email
                  : form.phone
              }
              onChange={handleChange}
              autoComplete={
                method === "email"
                  ? "email"
                  : "tel"
              }
              required
            />

          </div>

          {/* Password */}

          <div className="input-group">

            <Lock size={18} />

            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              minLength={6}
              required
            />

          </div>

          {/* Error */}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* Submit */}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login to AnAR"
              : "Create AnAR Account"}
          </button>

        </form>

        {/* Divider */}

        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Google */}

        <button
          className="google-button"
          type="button"
          onClick={handleGoogleLogin}
        >
          <span className="google-g">
            G
          </span>

          <span>
            Continue with Google
          </span>
        </button>

        {/* Terms */}

        <p className="auth-note">
          By continuing, you agree to AnAR's{" "}
          <span>Terms</span> and{" "}
          <span>Community Guidelines</span>.
        </p>

      </div>
    </div>
  );
}

export default Auth;