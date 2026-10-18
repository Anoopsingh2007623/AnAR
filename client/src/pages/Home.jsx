import { useEffect, useState } from "react";
import {
  Play,
  Share2,
  MessageCircle,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

/* =====================================================
   FORMAT VIEWS
   ===================================================== */

function formatViews(views = 0) {
  const number = Number(views || 0);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return String(number);
}

/* =====================================================
   FORMAT DATE
   ===================================================== */

function formatDate(date) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

/* =====================================================
   HOME
   ===================================================== */

function Home() {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  /* =====================================================
     FETCH LONG VIDEOS ONLY
     ===================================================== */

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");

      /*
        Backend query:
        ONLY long videos
      */

      const response =
        await API.get(
          "/videos?type=long"
        );

      if (
        response.data?.success
      ) {
        const serverVideos =
          response.data.videos || [];

        /*
          SECOND SAFETY FILTER

          Home should NEVER display Shorts.
        */

        const longVideos =
          Array.isArray(serverVideos)
            ? serverVideos.filter(
                (video) =>
                  video?.type ===
                  "long"
              )
            : [];

        setVideos(longVideos);
      } else {
        setVideos([]);

        setError(
          "Videos load nahi ho pa rahe hain."
        );
      }
    } catch (err) {
      console.error(
        "Home videos error:",
        err
      );

      setVideos([]);

      setError(
        err.response?.data?.message ||
          "Unable to load videos. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
     ===================================================== */

  useEffect(() => {
    fetchVideos();
  }, []);

  /* =====================================================
     OPEN VIDEO
     ===================================================== */

  const openVideo = (id) => {
    if (!id) return;

    navigate(
      `/video/${id}`
    );
  };

  /* =====================================================
     SHARE
     ===================================================== */

  const handleShare = async (
    video
  ) => {
    if (!video?._id) return;

    const shareUrl =
      `${window.location.origin}/video/${video._id}`;

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            video.title ||
            "AnAR Video",

          text:
            "Check out this video on AnAR",

          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          shareUrl
        );

        alert(
          "Video link copied!"
        );
      }
    } catch (err) {
      console.log(
        "Share cancelled"
      );
    }
  };

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <main className="home-page">
        <section className="home-heading">
          <div>
            <h1>AnAR</h1>

            <p>
              Discover videos from
              creators you love.
            </p>
          </div>
        </section>

        <div className="video-grid-loading">
          <div className="video-skeleton" />
          <div className="video-skeleton" />
          <div className="video-skeleton" />
          <div className="video-skeleton" />
        </div>
      </main>
    );
  }

  /* =====================================================
     ERROR
     ===================================================== */

  if (error) {
    return (
      <main className="home-page">
        <section className="home-heading">
          <div>
            <h1>AnAR</h1>

            <p>
              Discover videos from
              creators you love.
            </p>
          </div>
        </section>

        <div className="home-error">
          <h2>
            Something went wrong
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchVideos}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  /* =====================================================
     MAIN HOME
     ===================================================== */

  return (
    <main className="home-page">
      {/* =================================================
          HOME HEADING
          ================================================= */}

      {/* <section className="home-heading">
        <div>
          <h1>AnAR</h1>

          <p>
            Discover videos from
            creators you love.
          </p>
        </div>

        <button
          type="button"
          className="for-you-button"
        >
          For You
        </button>
      </section> */}

      {/* =================================================
          VIDEO GRID
          ================================================= */}

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Play size={28} />
          </div>

          <h2>
            No long videos yet
          </h2>

          <p>
            Be the first creator to
            upload a long video on
            AnAR.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/create")
            }
            className="create-video-button"
          >
            Create Video
          </button>
        </div>
      ) : (
        <section className="video-grid">
          {videos.map((video) => {
            /*
              Extra protection:
              Home should only render long.
            */

            if (
              video?.type !== "long"
            ) {
              return null;
            }

            const owner =
              video.owner || {};

            const creatorName =
              owner.name ||
              owner.username ||
              "AnAR Creator";

            const avatarLetter =
              creatorName
                .charAt(0)
                .toUpperCase();

            return (
              <article
                className="video-card"
                key={video._id}
              >
                {/* =======================================
                    THUMBNAIL
                    ======================================= */}

                <div
                  className="video-thumbnail"
                  onClick={() =>
                    openVideo(
                      video._id
                    )
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        "Enter" ||
                      event.key === " "
                    ) {
                      openVideo(
                        video._id
                      );
                    }
                  }}
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={
                        video.thumbnailUrl
                      }
                      alt={
                        video.title
                      }
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={
                        video.videoUrl
                      }
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}

                  <div className="thumbnail-overlay">
                    <div className="play-button">
                      <Play
                        size={22}
                        fill="currentColor"
                      />
                    </div>
                  </div>
                </div>

                {/* =======================================
                    VIDEO INFORMATION
                    ======================================= */}

                <div className="video-card-content">
                  <div className="video-card-main">
                    {/* Creator Avatar */}

                    <div className="creator-avatar">
                      {owner.avatar ? (
                        <img
                          src={
                            owner.avatar
                          }
                          alt={
                            creatorName
                          }
                        />
                      ) : (
                        avatarLetter
                      )}
                    </div>

                    {/* Text */}

                    <div className="video-card-info">
                      <h2
                        onClick={() =>
                          openVideo(
                            video._id
                          )
                        }
                      >
                        {video.title}
                      </h2>

                      <button
                        type="button"
                        className="creator-name"
                        onClick={() => {
                          if (
                            owner._id
                          ) {
                            navigate(
                              `/profile/${owner._id}`
                            );
                          }
                        }}
                      >
                        {creatorName}
                      </button>

                      <div className="video-meta">
                        <span>
                          <Eye
                            size={14}
                          />

                          {formatViews(
                            video.views
                          )}{" "}
                          views
                        </span>

                        <span>
                          {formatDate(
                            video.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* =====================================
                      ACTIONS
                      ===================================== */}

                  <div className="video-card-actions">
                    <button
                      type="button"
                      title="Comments"
                      onClick={() =>
                        openVideo(
                          video._id
                        )
                      }
                    >
                      <MessageCircle
                        size={18}
                      />

                      <span>
                        {formatViews(
                          video.commentsCount
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      title="Share"
                      onClick={() =>
                        handleShare(
                          video
                        )
                      }
                    >
                      <Share2
                        size={18}
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default Home;