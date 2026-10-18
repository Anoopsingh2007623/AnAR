import React, { useEffect, useState } from "react";

import {
  Users,
  UserX,
  Video,
  PlaySquare,
  MessageSquare,
  Eye,
  Heart,
  Clock,
} from "lucide-react";

import {
  getAdminDashboard,
} from "../../services/adminApi";

import "../admin.css";

const AdminDashboard = () => {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAdminDashboard();

      const data =
        response.data?.data ||
        response.data;

      setDashboard(data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-page">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          {error}
        </div>
      </div>
    );
  }

  /*
    Backend may return stats directly or
    inside stats.
  */
  const stats =
    dashboard?.stats ||
    dashboard ||
    {};

  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers ?? 0,
      icon: Users,
      color: "blue",
    },
    {
      title: "Blocked Users",
      value: stats.blockedUsers ?? 0,
      icon: UserX,
      color: "red",
    },
    {
      title: "Total Videos",
      value: stats.totalVideos ?? 0,
      icon: Video,
      color: "purple",
    },
    {
      title: "Shorts",
      value:
        stats.totalShorts ??
        stats.shortVideos ??
        0,
      icon: PlaySquare,
      color: "orange",
    },
    {
      title: "Comments",
      value:
        stats.totalComments ?? 0,
      icon: MessageSquare,
      color: "green",
    },
    {
      title: "Total Views",
      value:
        stats.totalViews ?? 0,
      icon: Eye,
      color: "cyan",
    },
    {
      title: "Total Likes",
      value:
        stats.totalLikes ?? 0,
      icon: Heart,
      color: "pink",
    },
    {
      title: "Long Videos",
      value:
        stats.totalLongVideos ??
        stats.longVideos ??
        0,
      icon: Clock,
      color: "yellow",
    },
  ];

  const recentUsers =
    dashboard?.recentUsers || [];

  const recentVideos =
    dashboard?.recentVideos || [];

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Monitor and manage your AnAR
            platform.
          </p>
        </div>

        <button
          className="admin-refresh-btn"
          onClick={loadDashboard}
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">

        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              className="admin-stat-card"
              key={card.title}
            >
              <div
                className={`admin-stat-icon ${card.color}`}
              >
                <Icon size={22} />
              </div>

              <div>
                <span>
                  {card.title}
                </span>

                <strong>
                  {Number(
                    card.value || 0
                  ).toLocaleString()}
                </strong>
              </div>
            </div>
          );
        })}

      </div>

      {/* Recent sections */}
      <div className="admin-two-column">

        {/* Recent Users */}
        <section className="admin-panel">

          <div className="admin-panel-header">
            <h2>Recent Users</h2>
          </div>

          {recentUsers.length === 0 ? (
            <div className="admin-empty">
              No users found.
            </div>
          ) : (
            <div className="admin-table-wrap">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentUsers.map(
                    (user) => (
                      <tr
                        key={user._id}
                      >
                        <td>
                          <div className="admin-user-cell">

                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                className="admin-table-avatar"
                                alt=""
                              />
                            ) : (
                              <div className="admin-table-avatar">
                                {(
                                  user.name ||
                                  "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div>
                              <strong>
                                {user.name}
                              </strong>

                              <small>
                                {user.email ||
                                  user.phone ||
                                  "No contact"}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          @{user.username}
                        </td>

                        <td>
                          <span
                            className={`admin-status ${
                              user.isBlocked
                                ? "blocked"
                                : "active"
                            }`}
                          >
                            {user.isBlocked
                              ? "Blocked"
                              : "Active"}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          )}

        </section>

        {/* Recent Videos */}
        <section className="admin-panel">

          <div className="admin-panel-header">
            <h2>Recent Videos</h2>
          </div>

          {recentVideos.length === 0 ? (
            <div className="admin-empty">
              No videos found.
            </div>
          ) : (
            <div className="admin-table-wrap">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Video</th>
                    <th>Type</th>
                    <th>Views</th>
                  </tr>
                </thead>

                <tbody>
                  {recentVideos.map(
                    (video) => (
                      <tr
                        key={video._id}
                      >
                        <td>
                          <div className="admin-video-cell">

                            {video.thumbnailUrl ? (
                              <img
                                src={
                                  video.thumbnailUrl
                                }
                                alt=""
                              />
                            ) : (
                              <div className="admin-video-placeholder">
                                ▶
                              </div>
                            )}

                            <div>
                              <strong>
                                {video.title ||
                                  "Untitled"}
                              </strong>

                              <small>
                                {video.owner?.username
                                  ? `@${video.owner.username}`
                                  : "Unknown"}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="admin-type-badge">
                            {video.type}
                          </span>
                        </td>

                        <td>
                          {Number(
                            video.views || 0
                          ).toLocaleString()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </div>
    </div>
  );
};

export default AdminDashboard;