import React, { useEffect, useMemo, useState } from "react";
import {
  UserRound,
  Edit3,
  Share2,
  Users,
  Video,
  Eye,
  Heart,
  Trash2,
  LogOut,
  X,
  Save,
  Play,
  Sparkles,
  UserPlus,
  Film,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getMyProfile,
  updateMyProfile,
  getMyVideos,
  deleteVideo,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

const getItems = (response) => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data?.videos)) {
    return response.data.videos;
  }

  if (Array.isArray(response.videos)) {
    return response.videos;
  }

  return [];
};

const formatNumber = (value = 0) => {
  const number = Number(value) || 0;

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return number.toString();
};

const getUserAvatar = (user) => {
  return (
    user?.avatar ||
    user?.profileImage ||
    user?.photoURL ||
    user?.image ||
    ""
  );
};

const getVideoId = (video) => {
  return video?._id || video?.id;
};

const getVideoTitle = (video) => {
  return video?.title || "Untitled video";
};

const getVideoThumbnail = (video) => {
  return (
    video?.thumbnailUrl ||
    video?.thumbnail ||
    video?.videoThumbnail ||
    ""
  );
};

const getVideoUrl = (video) => {
  return video?.videoUrl || video?.url || "";
};

export default function Profile() {
  const navigate = useNavigate();

  const { user: authUser, logout } = useAuth();

  const [profile, setProfile] = useState(null);

  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);

  const [contentTab, setContentTab] = useState("videos");

  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);

  const [error, setError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    bio: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadProfile();
    loadContent();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyProfile();

      const data =
        response?.data?.user ||
        response?.data ||
        response?.user ||
        response;

      setProfile(data);

      setEditForm({
        name: data?.name || "",
        username: data?.username || "",
        bio: data?.bio || "",
      });
    } catch (err) {
      console.error("Profile load error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      setContentLoading(true);

      const [longResponse, shortResponse] = await Promise.all([
        getMyVideos("long"),
        getMyVideos("short"),
      ]);

      setVideos(getItems(longResponse));
      setShorts(getItems(shortResponse));
    } catch (err) {
      console.error("Content load error:", err);
    } finally {
      setContentLoading(false);
    }
  };

  const currentUser = profile || authUser;

  const avatar = getUserAvatar(currentUser);

  const displayName =
    currentUser?.name ||
    currentUser?.username ||
    "AnAR User";

  const username =
    currentUser?.username ||
    "user";

  const bio =
    currentUser?.bio ||
    "Create. Grow. Earn.";

  const followers =
    currentUser?.followersCount ||
    currentUser?.followers?.length ||
    0;

  const following =
    currentUser?.followingCount ||
    currentUser?.following?.length ||
    0;

  const totalViews = useMemo(() => {
    return [...videos, ...shorts].reduce(
      (total, video) =>
        total + (Number(video?.views) || 0),
      0
    );
  }, [videos, shorts]);

  const totalLikes = useMemo(() => {
    return [...videos, ...shorts].reduce(
      (total, video) =>
        total + (Number(video?.likesCount) || 0),
      0
    );
  }, [videos, shorts]);

  const openEditModal = () => {
    setEditForm({
      name: currentUser?.name || "",
      username: currentUser?.username || "",
      bio: currentUser?.bio || "",
    });

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (savingProfile) return;

    setShowEditModal(false);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setError("");

      const payload = {
        name: editForm.name.trim(),
        username: editForm.username.trim().toLowerCase(),
        bio: editForm.bio.trim(),
      };

      const response = await updateMyProfile(payload);

      const updatedUser =
        response?.data?.user ||
        response?.data ||
        response?.user ||
        response;

      setProfile(updatedUser);

      setEditForm({
        name: updatedUser?.name || payload.name,
        username:
          updatedUser?.username || payload.username,
        bio: updatedUser?.bio || payload.bio,
      });

      setShowEditModal(false);
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      setSharing(true);

      const profileUrl =
        `${window.location.origin}/profile/${username}`;

      if (navigator.share) {
        await navigator.share({
          title: `${displayName} on AnAR`,
          text: `Check out @${username} on AnAR.`,
          url: profileUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl);
        alert("Profile link copied!");
      } else {
        prompt("Copy your profile link:", profileUrl);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share error:", err);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDeleteContent = async (video) => {
    const videoId = getVideoId(video);

    if (!videoId) {
      alert("Video ID not found.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${getVideoTitle(video)}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(videoId);

      await deleteVideo(videoId);

      setVideos((previous) =>
        previous.filter(
          (item) => getVideoId(item) !== videoId
        )
      );

      setShorts((previous) =>
        previous.filter(
          (item) => getVideoId(item) !== videoId
        )
      );
    } catch (err) {
      console.error("Delete error:", err);

      alert(
        err?.response?.data?.message ||
          "Unable to delete this content."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }

    navigate("/auth");
  };

  const handleOpenVideo = (video) => {
    const videoId = getVideoId(video);

    if (!videoId) return;

    navigate(`/video/${videoId}`);
  };

  const handleOpenShort = (short) => {
    const videoId = getVideoId(short);

    if (!videoId) return;

    navigate(`/video/${videoId}`);
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-spinner" />
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      {error && (
        <div className="profile-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* PROFILE HEADER */}
      <section className="profile-main">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">
                <UserRound size={42} />
              </div>
            )}
          </div>
        </div>

        <div className="profile-info">
          <h1>{displayName}</h1>

          <p className="profile-username">
            @{username}
          </p>

          <p className="profile-bio">
            {bio}
          </p>

          <div className="profile-actions">
            <button
              type="button"
              className="edit-profile-button"
              onClick={openEditModal}
            >
              <Edit3 size={16} />
              Edit Profile
            </button>

            <button
              type="button"
              className="share-profile-button"
              onClick={handleShareProfile}
              disabled={sharing}
            >
              <Share2 size={16} />
              {sharing ? "Sharing..." : "Share"}
            </button>

            <button
              type="button"
              className="profile-logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="profile-stats">
        <div className="profile-stat">
          <strong>{videos.length}</strong>
          <span>Videos</span>
        </div>

        <div className="profile-stat">
          <strong>{shorts.length}</strong>
          <span>Shorts</span>
        </div>

        <div className="profile-stat">
          <strong>{formatNumber(followers)}</strong>
          <span>Followers</span>
        </div>

        <div className="profile-stat">
          <strong>{formatNumber(following)}</strong>
          <span>Following</span>
        </div>

        <div className="profile-stat">
          <strong>{formatNumber(totalViews)}</strong>
          <span>Views</span>
        </div>
      </section>

      {/* EARNING CARD */}
      <section className="earning-card">
        <div className="earning-card-info">
          <div className="earning-icon">
            <Sparkles size={21} />
          </div>

          <div>
            <h3>Creator Earnings</h3>

            <p>
              Build your audience and unlock monetization
              on AnAR.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="earning-button"
          onClick={() => alert("Creator monetization is coming soon.")}
        >
          <BarChart3 size={16} />
          View Analytics
        </button>
      </section>

      {/* PROFILE CONTENT TABS */}
      <section className="profile-content">
        <div className="profile-tabs">
          <button
            type="button"
            className={
              contentTab === "videos"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() => setContentTab("videos")}
          >
            <Video size={17} />
            <span>Videos</span>
            <small>{videos.length}</small>
          </button>

          <button
            type="button"
            className={
              contentTab === "shorts"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() => setContentTab("shorts")}
          >
            <Film size={17} />
            <span>Shorts</span>
            <small>{shorts.length}</small>
          </button>
        </div>

        {/* LOADING */}
        {contentLoading ? (
          <div className="profile-content-loading">
            <div className="profile-loading-spinner" />
            <p>Loading content...</p>
          </div>
        ) : contentTab === "videos" ? (
          /* LONG VIDEOS */
          videos.length === 0 ? (
            <div className="profile-empty">
              <div className="profile-empty-icon">
                <Video size={30} />
              </div>

              <h3>No videos yet</h3>

              <p>
                Upload your first long video and start
                building your audience.
              </p>

              <button
                type="button"
                onClick={() => navigate("/create")}
              >
                Create Video
              </button>
            </div>
          ) : (
            <div className="profile-video-grid">
              {videos.map((video) => {
                const id = getVideoId(video);
                const thumbnail = getVideoThumbnail(video);

                return (
                  <article
                    key={id}
                    className="profile-video-card"
                    onClick={() => handleOpenVideo(video)}
                  >
                    <div className="profile-video-thumbnail">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={getVideoTitle(video)}
                        />
                      ) : getVideoUrl(video) ? (
                        <video
                          src={getVideoUrl(video)}
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <div className="profile-thumbnail-placeholder">
                          <Video size={30} />
                        </div>
                      )}

                      <div className="profile-video-play">
                        <Play
                          size={19}
                          fill="currentColor"
                        />
                      </div>

                      <div className="profile-video-duration">
                        {video?.duration
                          ? `${Math.floor(
                              Number(video.duration) / 60
                            )}:${String(
                              Math.floor(
                                Number(video.duration) % 60
                              )
                            ).padStart(2, "0")}`
                          : "Video"}
                      </div>
                    </div>

                    <div className="profile-video-info">
                      <h3>{getVideoTitle(video)}</h3>

                      <div className="profile-video-meta">
                        <span>
                          <Eye size={13} />
                          {formatNumber(video?.views)}
                        </span>

                        <span>
                          <Heart size={13} />
                          {formatNumber(video?.likesCount)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="profile-delete-button"
                      disabled={deletingId === id}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteContent(video);
                      }}
                      title="Delete video"
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                );
              })}
            </div>
          )
        ) : /* SHORTS */
        shorts.length === 0 ? (
          <div className="profile-empty">
            <div className="profile-empty-icon">
              <Film size={30} />
            </div>

            <h3>No Shorts yet</h3>

            <p>
              Create your first vertical Short and reach
              more people.
            </p>

            <button
              type="button"
              onClick={() => navigate("/create")}
            >
              Create Short
            </button>
          </div>
        ) : (
          <div className="profile-short-grid">
            {shorts.map((short) => {
              const id = getVideoId(short);
              const thumbnail = getVideoThumbnail(short);

              return (
                <article
                  key={id}
                  className="profile-short-card"
                  onClick={() => handleOpenShort(short)}
                >
                  <div className="profile-short-media">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={getVideoTitle(short)}
                      />
                    ) : getVideoUrl(short) ? (
                      <video
                        src={getVideoUrl(short)}
                        muted
                        preload="metadata"
                      />
                    ) : (
                      <div className="profile-short-placeholder">
                        <Film size={28} />
                      </div>
                    )}

                    <div className="profile-short-overlay" />

                    <div className="profile-short-play">
                      <Play
                        size={20}
                        fill="currentColor"
                      />
                    </div>

                    <div className="profile-short-stats">
                      <span>
                        <Eye size={13} />
                        {formatNumber(short?.views)}
                      </span>

                      <span>
                        <Heart size={13} />
                        {formatNumber(short?.likesCount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="profile-short-delete"
                      disabled={deletingId === id}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteContent(short);
                      }}
                      title="Delete Short"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="profile-short-title">
                    {getVideoTitle(short)}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ANALYTICS */}
      <section className="profile-analytics">
        <div className="profile-analytics-title">
          <div>
            <h2>Creator Overview</h2>
            <p>Your content performance</p>
          </div>

          <BarChart3 size={22} />
        </div>

        <div className="profile-analytics-grid">
          <div className="analytics-box">
            <Eye size={18} />
            <strong>{formatNumber(totalViews)}</strong>
            <span>Total Views</span>
          </div>

          <div className="analytics-box">
            <Heart size={18} />
            <strong>{formatNumber(totalLikes)}</strong>
            <span>Total Likes</span>
          </div>

          <div className="analytics-box">
            <Users size={18} />
            <strong>{formatNumber(followers)}</strong>
            <span>Followers</span>
          </div>

          <div className="analytics-box">
            <CheckCircle2 size={18} />
            <strong>
              {currentUser?.monetization?.approved
                ? "Active"
                : "Locked"}
            </strong>
            <span>Monetization</span>
          </div>
        </div>
      </section>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div
          className="edit-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="edit-modal">
            <div className="edit-modal-header">
              <div>
                <h2>Edit Profile</h2>
                <p>Update your AnAR profile.</p>
              </div>

              <button
                type="button"
                className="close-edit-modal"
                onClick={closeEditModal}
                disabled={savingProfile}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="edit-form-group">
                <label htmlFor="profile-name">
                  Name
                </label>

                <input
                  id="profile-name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  placeholder="Your name"
                  maxLength={60}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="profile-username">
                  Username
                </label>

                <input
                  id="profile-username"
                  name="username"
                  value={editForm.username}
                  onChange={handleEditChange}
                  placeholder="username"
                  maxLength={30}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="profile-bio">
                  Bio
                </label>

                <textarea
                  id="profile-bio"
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  placeholder="Tell people about yourself..."
                  maxLength={160}
                  rows={5}
                />

                <small>
                  {editForm.bio.length}/160
                </small>
              </div>

              <div className="edit-modal-actions">
                <button
                  type="button"
                  className="cancel-edit-button"
                  onClick={closeEditModal}
                  disabled={savingProfile}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-profile-button"
                  disabled={savingProfile}
                >
                  <Save size={16} />

                  {savingProfile
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}