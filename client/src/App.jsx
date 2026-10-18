import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

import {
  Home as HomeIcon,
  Clapperboard,
  Plus,
  Search,
  Bell,
} from "lucide-react";

import { useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminChangePassword from "./admin/pages/AdminChangePassword";

// Normal User Pages
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Shorts from "./pages/Shorts";
import Create from "./pages/Create";
import VideoPage from "./pages/VideoPage";

// Admin Pages
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminVideos from "./admin/pages/AdminVideos";
import AdminComments from "./admin/pages/AdminComments";

// ==========================================
// BOTTOM NAVIGATION
// ==========================================

function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bottom-navigation">

      {/* Home */}

      <Link
        to="/"
        className={
          isActive("/")
            ? "bottom-nav-item active"
            : "bottom-nav-item"
        }
      >
        <HomeIcon size={21} />
        <span>Home</span>
      </Link>

      {/* Shorts */}

      <Link
        to="/shorts"
        className={
          isActive("/shorts")
            ? "bottom-nav-item active"
            : "bottom-nav-item"
        }
      >
        <Clapperboard size={21} />
        <span>Shorts</span>
      </Link>

      {/* Create */}

      <Link
        to="/create"
        className="create-nav-button"
        aria-label="Create"
      >
        <Plus size={29} />
      </Link>

      {/* Profile */}

      <Link
        to="/profile"
        className={
          isActive("/profile")
            ? "bottom-nav-item active"
            : "bottom-nav-item"
        }
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="Profile"
            className={
              isActive("/profile")
                ? "bottom-profile-avatar active"
                : "bottom-profile-avatar"
            }
          />
        ) : (
          <div
            className={
              isActive("/profile")
                ? "bottom-profile-placeholder active"
                : "bottom-profile-placeholder"
            }
          >
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>
        )}

        <span>Profile</span>
      </Link>

    </nav>
  );
}

// ==========================================
// TOP NAVIGATION
// ==========================================

function TopNavigation() {
  const location = useLocation();

  // Hide on auth/admin
  if (
    location.pathname === "/auth" ||
    location.pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <header className="top-navigation">

      <Link
        to="/"
        className="AnAR-logo"
      >
        AnAR
      </Link>

      <div className="top-navigation-actions">

        <button
          type="button"
          className="top-nav-icon-button"
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        <button
          type="button"
          className="top-nav-icon-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

      </div>

    </header>
  );
}

// ==========================================
// ADMIN ROUTES
// ==========================================

function AdminRoutes() {
  return (
    <Routes>

      {/* ================================
          ADMIN LOGIN
      ================================= */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      {/* ================================
          EVERYTHING UNDER /admin
          IS PROTECTED
      ================================= */}

      <Route
        path="/admin/*"
        element={<AdminProtectedRoute />}
      >
        <Route
          element={<AdminLayout />}
        >

          {/* /admin */}

          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* Dashboard */}

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          {/* Users */}

          <Route
            path="users"
            element={<AdminUsers />}
          />

          {/* Videos */}

          <Route
            path="videos"
            element={<AdminVideos />}
          />

          {/* Comments */}

          <Route
            path="comments"
            element={<AdminComments />}
          />
          {/* Change Password */}
          <Route
            path="password"
            element={<AdminChangePassword />}
          />
          {/* Unknown admin URL */}

          <Route
            path="*"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

        </Route>
      </Route>

      {/* Fallback */}

      <Route
        path="*"
        element={
          <Navigate
            to="/admin/login"
            replace
          />
        }
      />

    </Routes>
  );
}

// ==========================================
// NORMAL APP ROUTES
// ==========================================

function NormalRoutes() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/auth";

  return (
    <div className="app-shell">

      {!isAuthPage && <TopNavigation />}

      <main
        className={
          isAuthPage
            ? "app-content auth-content"
            : "app-content"
        }
      >

        <Routes>

          {/* Auth */}

          <Route
            path="/auth"
            element={<Auth />}
          />

          {/* Home */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Video */}

          <Route
            path="/video/:id"
            element={
              <ProtectedRoute>
                <VideoPage />
              </ProtectedRoute>
            }
          />

          {/* Profile */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Shorts */}

          <Route
            path="/shorts"
            element={
              <ProtectedRoute>
                <Shorts />
              </ProtectedRoute>
            }
          />

          {/* Create */}

          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <Create />
              </ProtectedRoute>
            }
          />

          {/* Normal fallback */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </main>

      {!isAuthPage && (
        <BottomNavigation />
      )}

    </div>
  );
}

// ==========================================
// APP
// ==========================================

function AppContent() {
  const location = useLocation();

  const isAdminRoute =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  if (isAdminRoute) {
    return <AdminRoutes />;
  }

  return <NormalRoutes />;
}

// ==========================================
// APP
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;