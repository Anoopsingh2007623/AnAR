import React, {
  useEffect,
  useState,
} from "react";

import {
  Search,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

import {
  getAdminVideos,
  toggleAdminVideoVisibility,
  deleteAdminVideo,
} from "../../services/adminApi";

import "../admin.css";

const AdminVideos = () => {
  const [videos, setVideos] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [type, setType] =
    useState("");

  const [visibility, setVisibility] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pages, setPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const loadVideos = async (
    requestedPage = page
  ) => {
    try {
      setLoading(true);

      const response =
        await getAdminVideos({
          search,
          type,
          visibility,
          page: requestedPage,
          limit: 10,
        });

      const data =
        response.data?.data ||
        response.data;

      setVideos(data.videos || []);
      setPages(data.pages || 1);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load videos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos(page);
  }, [
    page,
    type,
    visibility,
  ]);

  const handleSearch = async (e) => {
    e.preventDefault();

    setPage(1);

    await loadVideos(1);
  };

  const handleVisibility = async (
    video
  ) => {
    const action =
      video.visibility === "public"
        ? "hide"
        : "show";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} this video?`
      );

    if (!confirmed) return;

    try {
      await toggleAdminVideoVisibility(
        video._id
      );

      await loadVideos(page);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to change visibility."
      );
    }
  };

  const handleDelete = async (
    video
  ) => {
    const confirmed =
      window.confirm(
        "Delete this video permanently?"
      );

    if (!confirmed) return;

    try {
      await deleteAdminVideo(
        video._id
      );

      await loadVideos(page);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete video."
      );
    }
  };

  return (
    <div className="admin-page">

      <div className="admin-page-header">
        <div>
          <h1>Videos</h1>

          <p>
            Manage long videos and
            shorts uploaded on AnAR.
          </p>
        </div>
      </div>

      <section className="admin-panel">

        {/* Filters */}
        <div className="admin-video-filters">

          <form
            className="admin-search"
            onSubmit={handleSearch}
          >
            <Search size={19} />

            <input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <button type="submit">
              Search
            </button>
          </form>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">
              All Types
            </option>

            <option value="long">
              Long Videos
            </option>

            <option value="short">
              Shorts
            </option>
          </select>

          <select
            value={visibility}
            onChange={(e) => {
              setVisibility(
                e.target.value
              );

              setPage(1);
            }}
          >
            <option value="">
              All Visibility
            </option>

            <option value="public">
              Public
            </option>

            <option value="private">
              Private
            </option>
          </select>

        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-loading">
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div className="admin-empty">
            No videos found.
          </div>
        ) : (
          <div className="admin-table-wrap">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>Video</th>
                  <th>Creator</th>
                  <th>Type</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {videos.map((video) => (
                  <tr key={video._id}>

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
                              "Untitled Video"}
                          </strong>

                          <small>
                            {video.createdAt
                              ? new Date(
                                  video.createdAt
                                ).toLocaleDateString()
                              : ""}
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      {video.owner
                        ?.username
                        ? `@${video.owner.username}`
                        : "Unknown"}
                    </td>

                    <td>
                      <span className="admin-type-badge">
                        {video.type ||
                          "unknown"}
                      </span>
                    </td>

                    <td>
                      {Number(
                        video.views || 0
                      ).toLocaleString()}
                    </td>

                    <td>
                      {Number(
                        video.likesCount ||
                          0
                      ).toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={`admin-status ${
                          video.visibility ===
                          "public"
                            ? "active"
                            : "blocked"
                        }`}
                      >
                        {video.visibility ||
                          "unknown"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions">

                        <button
                          type="button"
                          className="admin-action-warning"
                          onClick={() =>
                            handleVisibility(
                              video
                            )
                          }
                          title={
                            video.visibility ===
                            "public"
                              ? "Hide video"
                              : "Show video"
                          }
                        >
                          {video.visibility ===
                          "public" ? (
                            <EyeOff
                              size={18}
                            />
                          ) : (
                            <Eye
                              size={18}
                            />
                          )}
                        </button>

                        <button
                          type="button"
                          className="admin-action-danger"
                          onClick={() =>
                            handleDelete(
                              video
                            )
                          }
                          title="Delete video"
                        >
                          <Trash2
                            size={18}
                          />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="admin-pagination">

          <button
            disabled={page <= 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            Previous
          </button>

          <span>
            Page {page} of {pages}
          </span>

          <button
            disabled={page >= pages}
            onClick={() =>
              setPage((p) => p + 1)
            }
          >
            Next
          </button>

        </div>

      </section>
    </div>
  );
};

export default AdminVideos;