import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  UserCheck,
  Loader2,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import API, {
  registerVideoView,
} from "../services/api";


// ======================================================
// FORMAT NUMBER
// ======================================================

function formatViews(value = 0) {
  const number = Number(value) || 0;

  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)}B`;
  }

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return String(number);
}


// ======================================================
// VIDEO PAGE
// ======================================================

function VideoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ====================================================
  // STATES
  // ====================================================

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [following, setFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // ====================================================
  // VIDEO VIEW TRACKING REFS
  // ====================================================

  const videoElementRef = useRef(null);

  const viewTimerRef = useRef(null);

  // Prevent duplicate view on same VideoPage session
  const viewRegisteredRef = useRef(false);


  // ====================================================
  // CLEAR VIEW TIMER
  // ====================================================

  const clearViewTimer = () => {
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
  };


  // ====================================================
  // REGISTER VIDEO VIEW
  // ====================================================

  const registerCurrentVideoView = async () => {
    if (!id) return;

    // Already counted
    if (viewRegisteredRef.current) {
      return;
    }

    const videoElement = videoElementRef.current;

    // Video must actually be playing
    if (
      !videoElement ||
      videoElement.paused ||
      videoElement.ended
    ) {
      return;
    }

    try {
      // Mark before API call to avoid duplicate requests
      viewRegisteredRef.current = true;

      console.log("👁️ Registering video view:", id);

      const response = await registerVideoView(id);

      console.log(
        "👁️ View response:",
        response?.data
      );

      // ------------------------------------------------
      // Try different possible backend response formats
      // ------------------------------------------------

      const returnedViews =
        response?.data?.views ??
        response?.data?.video?.views ??
        response?.data?.data?.views;

      const newViews = Number(returnedViews);

      if (Number.isFinite(newViews)) {
        setVideo((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            views: newViews,
          };
        });
      } else {
        // If backend doesn't return views,
        // increment current UI value locally.
        setVideo((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            views: Number(previous.views || 0) + 1,
          };
        });
      }

      console.log("✅ Video view counted");
    } catch (err) {
      // Allow retry if request failed
      viewRegisteredRef.current = false;

      console.error(
        "❌ Video view error:",
        err.response?.data || err.message
      );
    }
  };


  // ====================================================
  // START 3 SECOND VIEW TIMER
  // ====================================================

  const startVideoViewTimer = () => {
    clearViewTimer();

    if (viewRegisteredRef.current) {
      return;
    }

    const videoElement = videoElementRef.current;

    if (
      !videoElement ||
      videoElement.paused ||
      videoElement.ended
    ) {
      return;
    }

    console.log("⏱️ View timer started");

    viewTimerRef.current = setTimeout(() => {
      viewTimerRef.current = null;

      registerCurrentVideoView();
    }, 3000);
  };


  // ====================================================
  // FETCH VIDEO
  // ====================================================

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/videos/${id}`);

        if (response.data?.success) {
          setVideo(response.data.video);
        } else {
          setError("Video not found.");
        }
      } catch (err) {
        console.error("Video load error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load video."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideo();
    }
  }, [id]);


  // ====================================================
  // RESET VIEW TRACKING WHEN VIDEO CHANGES
  // ====================================================

  useEffect(() => {
    clearViewTimer();

    viewRegisteredRef.current = false;

    return () => {
      clearViewTimer();
    };
  }, [id]);


  // ====================================================
  // CHECK FOLLOW STATUS
  // ====================================================

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!video?.owner?._id) return;

      const token = localStorage.getItem(
        "skillsetu_token"
      );

      if (!token) return;

      try {
        const response = await API.get(
          `/users/${video.owner._id}/follow-status`
        );

        if (response.data?.success) {
          setFollowing(
            Boolean(response.data.following)
          );

          setIsSelf(
            Boolean(response.data.self)
          );
        }
      } catch (err) {
        console.error(
          "Follow status error:",
          err.response?.data || err.message
        );
      }
    };

    checkFollowStatus();
  }, [video]);


  // ====================================================
  // FOLLOW / UNFOLLOW
  // ====================================================

  const handleFollow = async () => {
    if (!video?.owner?._id) return;

    const token = localStorage.getItem(
      "skillsetu_token"
    );

    if (!token) {
      navigate("/auth");
      return;
    }

    if (isSelf || followLoading) return;

    try {
      setFollowLoading(true);

      if (following) {
        await API.delete(
          `/users/${video.owner._id}/follow`
        );

        setFollowing(false);

        setVideo((prev) => ({
          ...prev,
          owner: {
            ...prev.owner,
            followersCount: Math.max(
              0,
              (prev.owner?.followersCount || 0) - 1
            ),
          },
        }));
      } else {
        await API.post(
          `/users/${video.owner._id}/follow`
        );

        setFollowing(true);

        setVideo((prev) => ({
          ...prev,
          owner: {
            ...prev.owner,
            followersCount:
              (prev.owner?.followersCount || 0) + 1,
          },
        }));
      }
    } catch (err) {
      console.error(
        "Follow error:",
        err.response?.data || err.message
      );

      if (err.response?.status === 401) {
        navigate("/auth");
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to update follow status."
      );
    } finally {
      setFollowLoading(false);
    }
  };


  // ====================================================
  // LIKE UI
  // ====================================================

  const handleLike = () => {
    setLiked((prev) => !prev);
  };


  // ====================================================
  // COMMENTS UI
  // ====================================================

  const handleComments = () => {
    setShowComments((prev) => !prev);
  };


  // ====================================================
  // SHARE
  // ====================================================

  const handleShare = async () => {
    if (!video) return;

    const shareUrl =
      `${window.location.origin}/video/${video._id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: "Check out this video on AnAR",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          shareUrl
        );

        alert("Video link copied!");
      }
    } catch (err) {
      console.log("Share cancelled");
    }
  };


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="video-page-loading">
        <Loader2
          size={34}
          className="loading-spinner"
        />

        <p>Loading video...</p>
      </div>
    );
  }


  // ====================================================
  // ERROR
  // ====================================================

  if (error || !video) {
    return (
      <div className="video-page-error">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={19} />

          <span>Back</span>
        </button>

        <h2>
          {error || "Video not found"}
        </h2>
      </div>
    );
  }


  // ====================================================
  // CREATOR DATA
  // ====================================================

  const owner = video.owner || {};

  const creatorName =
    owner.name ||
    owner.username ||
    "AnAR Creator";

  const avatarLetter =
    creatorName.charAt(0).toUpperCase();

  const followers =
    owner.followersCount || 0;

  const likes =
    video.likesCount || 0;

  const comments =
    video.commentsCount || 0;


  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <div className="video-page">

      {/* Back */}

      <button
        type="button"
        className="back-button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={19} />

        <span>Back</span>
      </button>


      {/* ================================================
          VIDEO PLAYER
      ================================================= */}

      <div className="video-player-container">

        <video
          ref={videoElementRef}
          className="video-page-player"
          src={video.videoUrl}
          poster={
            video.thumbnailUrl || undefined
          }
          controls
          playsInline
          preload="metadata"

          /*
           * View tracking:
           * 3 seconds continuous playback
           */

          onPlay={() => {
            console.log("▶️ Video playing");

            startVideoViewTimer();
          }}

          onPause={() => {
            console.log("⏸️ Video paused");

            clearViewTimer();
          }}

          onEnded={() => {
            console.log("⏹️ Video ended");

            clearViewTimer();
          }}

          onSeeking={() => {
            clearViewTimer();
          }}

          onWaiting={() => {
            clearViewTimer();
          }}

          onCanPlay={() => {
            const videoElement =
              videoElementRef.current;

            if (
              videoElement &&
              !videoElement.paused &&
              !videoElement.ended
            ) {
              startVideoViewTimer();
            }
          }}
        />

      </div>


      {/* ================================================
          CONTENT
      ================================================= */}

      <div className="video-page-content">


        {/* ==============================================
            TITLE
        =============================================== */}

        <h1 className="video-page-title">
          {video.title}
        </h1>


        {/* ==============================================
            VIEWS
        =============================================== */}

        <p className="video-page-meta">
          {formatViews(video.views)} views
        </p>


        {/* ==============================================
            CREATOR
        =============================================== */}

        <div className="video-creator-section">

          <div className="video-creator-profile">

            <div className="creator-avatar video-page-avatar">

              {owner.avatar ? (
                <img
                  src={owner.avatar}
                  alt={creatorName}
                />
              ) : (
                avatarLetter
              )}

            </div>


            <div className="video-creator-info">

              <h3>
                {creatorName}
              </h3>

              <p>
                {formatViews(followers)} followers
              </p>

            </div>

          </div>


          {/* Follow Button */}

          {!isSelf && (
            <button
              type="button"
              className={
                following
                  ? "video-follow-button following"
                  : "video-follow-button"
              }
              onClick={handleFollow}
              disabled={followLoading}
            >

              {followLoading ? (
                <Loader2
                  size={17}
                  className="follow-spinner"
                />
              ) : following ? (
                <>
                  <UserCheck size={17} />

                  <span>
                    Following
                  </span>
                </>
              ) : (
                <>
                  <UserPlus size={17} />

                  <span>
                    Follow
                  </span>
                </>
              )}

            </button>
          )}

        </div>


        {/* ==============================================
            ACTIONS
        =============================================== */}

        <div className="video-page-actions">


          {/* Like */}

          <button
            type="button"
            className={
              liked
                ? "video-action-button active"
                : "video-action-button"
            }
            onClick={handleLike}
          >
            <Heart
              size={20}
              fill={
                liked
                  ? "currentColor"
                  : "none"
              }
            />

            <span>
              {formatViews(
                likes + (liked ? 1 : 0)
              )}
            </span>
          </button>


          {/* Comments */}

          <button
            type="button"
            className={
              showComments
                ? "video-action-button active"
                : "video-action-button"
            }
            onClick={handleComments}
          >
            <MessageCircle size={20} />

            <span>
              {formatViews(comments)}
            </span>
          </button>


          {/* Share */}

          <button
            type="button"
            className="video-action-button"
            onClick={handleShare}
          >
            <Share2 size={20} />

            <span>
              Share
            </span>
          </button>

        </div>


        {/* ==============================================
            COMMENTS
        =============================================== */}

        {showComments && (
          <div className="video-comments-box">

            <div className="video-comments-header">

              <h3>
                Comments
              </h3>

              <button
                type="button"
                className="comments-close-button"
                onClick={() =>
                  setShowComments(false)
                }
              >
                Close
              </button>

            </div>


            <div className="comments-empty">

              <MessageCircle size={28} />

              <p>
                No comments yet.
              </p>

              <span>
                Comment system coming soon.
              </span>

            </div>

          </div>
        )}


        {/* ==============================================
            DESCRIPTION
        =============================================== */}

        <div className="video-description">

          <h3>
            Description
          </h3>

          <p>
            {video.description ||
              "No description available."}
          </p>

        </div>

      </div>

    </div>
  );
}

export default VideoPage;