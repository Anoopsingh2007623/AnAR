import React, { useState } from "react";

import {
    NavLink,
    Outlet,
    useNavigate,
} from "react-router-dom";

import {
    LayoutDashboard,
    Users,
    Video,
    MessageSquare,
    LogOut,
    ShieldCheck,
    Menu,
    X,
    KeyRound,
} from "lucide-react";

import "./admin.css";

const AdminLayout = () => {
    const navigate = useNavigate();

    const [mobileMenu, setMobileMenu] =
        useState(false);

    // ==========================================
    // GET ADMIN DATA
    // ==========================================

    let admin = null;

    try {
        admin = JSON.parse(
            localStorage.getItem("anar_admin") ||
            "null"
        );
    } catch (error) {
        console.error(
            "Failed to read admin data:",
            error
        );

        admin = null;
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    const logout = () => {
        localStorage.removeItem(
            "anar_admin_token"
        );

        localStorage.removeItem(
            "anar_admin"
        );

        setMobileMenu(false);

        navigate("/admin/login", {
            replace: true,
        });
    };

    // ==========================================
    // NAVIGATION
    // ==========================================

    const navItems = [
        {
            path: "/admin/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            path: "/admin/users",
            label: "Users",
            icon: Users,
        },
        {
            path: "/admin/videos",
            label: "Videos",
            icon: Video,
        },
        {
            path: "/admin/comments",
            label: "Comments",
            icon: MessageSquare,
        },
        {
            path: "/admin/password",
            label: "Change Password",
            icon: KeyRound,
        },
    ];

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="admin-app">

            {/* ====================================
          MOBILE HEADER
      ==================================== */}

            <header className="admin-mobile-header">

                <div className="admin-brand">
                    <ShieldCheck size={24} />

                    <span>
                        AnAR Admin
                    </span>
                </div>

                <button
                    type="button"
                    className="admin-mobile-menu-btn"
                    onClick={() =>
                        setMobileMenu(
                            (prev) => !prev
                        )
                    }
                    aria-label="Toggle menu"
                >
                    {mobileMenu ? (
                        <X size={24} />
                    ) : (
                        <Menu size={24} />
                    )}
                </button>

            </header>

            {/* ====================================
          SIDEBAR
      ==================================== */}

            <aside
                className={`admin-sidebar ${mobileMenu
                        ? "admin-sidebar-open"
                        : ""
                    }`}
            >

                {/* Sidebar Brand */}

                <div className="admin-sidebar-brand">

                    <div className="admin-logo">
                        <ShieldCheck size={27} />
                    </div>

                    <div>
                        <h2>
                            AnAR
                        </h2>

                        <span>
                            Admin Panel
                        </span>
                    </div>

                </div>

                {/* Navigation */}

                <nav className="admin-nav">

                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() =>
                                    setMobileMenu(false)
                                }
                                className={({ isActive }) =>
                                    `admin-nav-link ${isActive
                                        ? "admin-nav-active"
                                        : ""
                                    }`
                                }
                            >

                                <Icon size={20} />

                                <span>
                                    {item.label}
                                </span>

                            </NavLink>
                        );
                    })}

                </nav>

                {/* ==================================
            SIDEBAR BOTTOM
        ================================== */}

                <div className="admin-sidebar-bottom">

                    {/* Admin User */}

                    <div className="admin-user-mini">

                        <div className="admin-avatar">
                            {(
                                admin?.name ||
                                "A"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>

                            <strong>
                                {admin?.name ||
                                    "Admin"}
                            </strong>

                            <small>
                                {admin?.role ||
                                    "admin"}
                            </small>

                        </div>

                    </div>

                    {/* Logout */}

                    <button
                        type="button"
                        className="admin-logout"
                        onClick={logout}
                    >
                        <LogOut size={18} />

                        <span>
                            Logout
                        </span>
                    </button>

                </div>

            </aside>

            {/* ====================================
          MAIN CONTENT
      ==================================== */}

            <main className="admin-main">
                <Outlet />
            </main>

        </div>
    );
};

export default AdminLayout;