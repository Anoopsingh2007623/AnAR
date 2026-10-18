import { useEffect, useRef, useState } from "react";

import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  UserPlus,
  Check,
  Play,
  RefreshCw,
  X,
  Send,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  getPublicVideos,
  getFollowStatus,
  followUser,
  unfollowUser,
  toggleVideoLike,
  getVideoLikeStatus,
  getVideoComments,
  addVideoComment,
} from "../services/api";

function Shorts() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sound ON by default
  const [muted, setMuted] = useState(false);

  // Follow state
  const [following, setFollowing] = useState({});

  // Like state
  const [likedVideos, setLikedVideos] = useState({});
  const [likeLoading, setLikeLoading] = useState({});

  // Comment state
  const [commentVideo, setCommentVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Active video
  const [activeVideo, setActiveVideo] = useState(null);

  const feedRef = useRef(null);
  const videoRefs = useRef({});
  const shortItemRefs = useRef({});
  const activeVideoRef = useRef(null);

  // Cancels older async play request
  const playRequestRef = useRef(0);

  // Wait until scrolling/swiping settles
  const scrollTimerRef = useRef(null);

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    null;

  // =========================================================
  // CREATOR
  // =========================================================

  const getCreator = (short) => {
    const creator = short?.owner || short?.user || {};

    const creatorId =
      creator?._id ||
      creator?.id ||
      (typeof short?.owner === "string"
        ? short.owner
        : null);

    return {
      creator,
      creatorId,
      creatorName:
        creator?.name ||
        creator?.username ||
        "AnAR Creator",
      creatorUsername: creator?.username || "",
    };
  };

  // =========================================================
  // FORMAT NUMBER
  // =========================================================

  const formatNumber = (value) => {
    const number = Number(value || 0);

    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    }

    if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }

    return number;
  };

  // =========================================================
  // STOP ALL VIDEOS
  // =========================================================

  const stopAllVideos = (exceptId = null) => {
    Object.entries(videoRefs.current).forEach(
      ([videoId, video]) => {
        if (!video || videoId === exceptId) return;

        try {
          video.pause();
          video.currentTime = 0;

          // Every inactive video stays muted
          video.muted = true;
        } catch (err) {
          console.warn("Unable to stop video:", err);
        }
      }
    );
  };

  // =========================================================
  // PLAY ONLY ACTIVE VIDEO
  // =========================================================

  const playOnlyActiveVideo = async (videoId) => {
    if (!videoId) return;

    const video = videoRefs.current[videoId];

    if (!video) {
      console.warn("Video element not ready:", videoId);
      return;
    }

    const requestId = ++playRequestRef.current;

    // Stop previous short
    stopAllVideos(videoId);

    activeVideoRef.current = videoId;
    setActiveVideo(videoId);

    try {
      video.playsInline = true;

      // Active video follows current sound state
      video.muted = muted;

      // Start from beginning
      video.currentTime = 0;

      if (requestId !== playRequestRef.current) {
        return;
      }

      await video.play();

      // If user moved to another short while play() was waiting
      if (requestId !== playRequestRef.current) {
        video.pause();
        video.currentTime = 0;
        return;
      }

      console.log(
        "▶️ Shorts playing:",
        videoId,
        "| Sound:",
        video.muted ? "OFF" : "ON"
      );
    } catch (err) {
      // Browser may block autoplay with sound
      console.warn(
        "Autoplay with sound was blocked:",
        err
      );
    }
  };

  // =========================================================
  // FIND CENTER SHORT
  // =========================================================

  const getClosestShortIndex = () => {
    const feed = feedRef.current;

    if (!feed || !shorts.length) {
      return -1;
    }

    const feedRect = feed.getBoundingClientRect();

    const feedCenter =
      feedRect.top + feedRect.height / 2;

    let closestIndex = -1;
    let smallestDistance = Infinity;

    shorts.forEach((_, index) => {
      const item = shortItemRefs.current[index];

      if (!item) return;

      const rect = item.getBoundingClientRect();

      const itemCenter =
        rect.top + rect.height / 2;

      const distance = Math.abs(
        feedCenter - itemCenter
      );

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  // =========================================================
  // ACTIVATE VIDEO BY INDEX
  // =========================================================

  const activateVideoByIndex = async (index) => {
    if (
      index < 0 ||
      index >= shorts.length
    ) {
      return;
    }

    const videoId = shorts[index]?._id;

    if (!videoId) return;

    await playOnlyActiveVideo(videoId);
  };

  // =========================================================
  // SHORTS SCROLL
  // =========================================================

  const handleShortsScroll = () => {
    const feed = feedRef.current;

    if (!feed || !shorts.length) return;

    // Immediately pause current video while swiping
    const currentId = activeVideoRef.current;

    if (currentId) {
      const currentVideo =
        videoRefs.current[currentId];

      if (currentVideo) {
        try {
          currentVideo.pause();
        } catch (err) {
          console.warn(
            "Scroll pause error:",
            err
          );
        }
      }
    }

    // Clear previous timer
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }

    // Wait for scroll to settle
    scrollTimerRef.current = setTimeout(() => {
      const closestIndex =
        getClosestShortIndex();

      if (closestIndex !== -1) {
        activateVideoByIndex(closestIndex);
      }
    }, 120);
  };

  // =========================================================
  // LOAD LIKE STATUS
  // =========================================================

  const loadLikeStatuses = async (shortVideos) => {
    // No logged-in user
    if (!currentUserId) {
      setLikedVideos({});
      return;
    }

    const likeResults = {};

    await Promise.all(
      shortVideos.map(async (video) => {
        const videoId = video?._id;

        if (!videoId) return;

        try {
          const response =
            await getVideoLikeStatus(videoId);

          likeResults[videoId] =
            response?.data?.liked ??
            response?.data?.isLiked ??
            false;
        } catch (err) {
          console.warn(
            "Like status error:",
            videoId,
            err
          );

          likeResults[videoId] = false;
        }
      })
    );

    setLikedVideos(likeResults);
  };

  // =========================================================
  // LOAD SHORTS
  // =========================================================

  const loadShorts = async () => {
    try {
      setLoading(true);
      setError("");

      ++playRequestRef.current;

      stopAllVideos();

      activeVideoRef.current = null;
      setActiveVideo(null);

      const response =
        await getPublicVideos("short");

      const data =
        response?.data?.videos ||
        response?.data?.data ||
        response?.data ||
        [];

      const shortVideos =
        Array.isArray(data)
          ? data.filter(
              (video) =>
                video?.type === "short"
            )
          : [];

      setShorts(shortVideos);

      // =====================================================
      // LOAD LIKE STATUS
      // =====================================================

      await loadLikeStatuses(shortVideos);

      // =====================================================
      // LOAD FOLLOW STATUS
      // =====================================================

      const creatorIds = [
        ...new Set(
          shortVideos
            .map((video) => {
              const owner =
                video?.owner ||
                video?.user ||
                {};

              return (
                owner?._id ||
                owner?.id ||
                (typeof video?.owner === "string"
                  ? video.owner
                  : null)
              );
            })
            .filter(Boolean)
        ),
      ];

      const followResults = {};

      await Promise.all(
        creatorIds.map(async (creatorId) => {
          // Don't follow yourself
          if (
            currentUserId &&
            String(creatorId) ===
              String(currentUserId)
          ) {
            followResults[creatorId] = false;
            return;
          }

          try {
            const result =
              await getFollowStatus(
                creatorId
              );

            followResults[creatorId] =
              result?.data?.following ??
              result?.data?.isFollowing ??
              false;
          } catch (followError) {
            console.warn(
              "Follow status error:",
              creatorId,
              followError
            );

            followResults[creatorId] = false;
          }
        })
      );

      setFollowing(followResults);
    } catch (err) {
      console.error(
        "Shorts loading error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load Shorts."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadShorts();

    return () => {
      ++playRequestRef.current;

      if (scrollTimerRef.current) {
        clearTimeout(
          scrollTimerRef.current
        );
      }

      Object.values(
        videoRefs.current
      ).forEach((video) => {
        if (!video) return;

        try {
          video.pause();
          video.currentTime = 0;
        } catch (err) {
          console.warn(
            "Cleanup video error:",
            err
          );
        }
      });

      videoRefs.current = {};
      shortItemRefs.current = {};
      activeVideoRef.current = null;
    };
  }, []);

  // =========================================================
  // PLAY FIRST SHORT
  // =========================================================

  useEffect(() => {
    if (!shorts.length) return;

    const timer = setTimeout(() => {
      const closestIndex =
        getClosestShortIndex();

      activateVideoByIndex(
        closestIndex === -1
          ? 0
          : closestIndex
      );
    }, 150);

    return () => clearTimeout(timer);
  }, [shorts]);

  // =========================================================
  // TOGGLE MUTE
  // =========================================================

  const toggleMute = () => {
    setMuted((previous) => {
      const newMuted = !previous;

      const activeId =
        activeVideoRef.current;

      Object.entries(
        videoRefs.current
      ).forEach(([videoId, video]) => {
        if (!video) return;

        video.muted =
          videoId === activeId
            ? newMuted
            : true;
      });

      return newMuted;
    });
  };

  // =========================================================
  // VIDEO CLICK
  // =========================================================

  const handleVideoClick = async (
    event,
    videoId
  ) => {
    const video = event.currentTarget;

    if (
      activeVideoRef.current !== videoId
    ) {
      await playOnlyActiveVideo(
        videoId
      );

      return;
    }

    if (video.paused) {
      try {
        video.muted = muted;
        await video.play();
      } catch (err) {
        console.warn(
          "Video play failed:",
          err
        );
      }
    } else {
      video.pause();
    }
  };

  // =========================================================
  // LIKE
  // =========================================================

  const handleLike = async (videoId) => {
    if (!videoId) return;

    // Login required
    if (!currentUserId) {
      navigate("/auth");
      return;
    }

    // Prevent double click
    if (likeLoading[videoId]) {
      return;
    }

    try {
      setLikeLoading((previous) => ({
        ...previous,
        [videoId]: true,
      }));

      const response =
        await toggleVideoLike(videoId);

      const data = response?.data || {};

      const liked =
        data?.liked ??
        data?.isLiked ??
        false;

      const likesCount =
        Number(data?.likesCount);

      // Update liked state
      setLikedVideos((previous) => ({
        ...previous,
        [videoId]: liked,
      }));

      // Update like count
      setShorts((previous) =>
        previous.map((video) => {
          if (video?._id !== videoId) {
            return video;
          }

          return {
            ...video,
            likesCount: Number.isFinite(
              likesCount
            )
              ? likesCount
              : Math.max(
                  0,
                  Number(
                    video.likesCount || 0
                  ) +
                    (liked ? 1 : -1)
                ),
          };
        })
      );
    } catch (err) {
      console.error(
        "Like action error:",
        err
      );

      if (
        err?.response?.status === 401
      ) {
        navigate("/auth");
      } else {
        alert(
          err?.response?.data?.message ||
            "Unable to like this Short."
        );
      }
    } finally {
      setLikeLoading((previous) => ({
        ...previous,
        [videoId]: false,
      }));
    }
  };

  // =========================================================
  // COMMENTS - OPEN
  // =========================================================

  const handleOpenComments = async (video) => {
    const videoId = video?._id;

    if (!videoId) return;

    setCommentVideo(video);
    setComments([]);
    setCommentText("");
    setCommentsLoading(true);

    try {
      const response =
        await getVideoComments(videoId);

      const data = response?.data || {};

      setComments(
        Array.isArray(data?.comments)
          ? data.comments
          : []
      );

      // Keep latest comment count
      if (
        Number.isFinite(
          Number(data?.commentsCount)
        )
      ) {
        setShorts((previous) =>
          previous.map((item) =>
            item?._id === videoId
              ? {
                  ...item,
                  commentsCount:
                    Number(
                      data.commentsCount
                    ),
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error(
        "Load comments error:",
        err
      );

      alert(
        err?.response?.data?.message ||
          "Unable to load comments."
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  // =========================================================
  // COMMENTS - CLOSE
  // =========================================================

  const handleCloseComments = () => {
    setCommentVideo(null);
    setComments([]);
    setCommentText("");
    setCommentsLoading(false);
    setCommentSubmitting(false);
  };

  // =========================================================
  // COMMENTS - SUBMIT
  // =========================================================

  const handleSubmitComment = async () => {
    const videoId =
      commentVideo?._id;

    const text = commentText.trim();

    if (!videoId) return;

    if (!currentUserId) {
      navigate("/auth");
      return;
    }

    if (!text) {
      return;
    }

    if (text.length > 1000) {
      alert(
        "Comment cannot exceed 1000 characters."
      );
      return;
    }

    if (commentSubmitting) return;

    try {
      setCommentSubmitting(true);

      const response =
        await addVideoComment(
          videoId,
          text
        );

      const data = response?.data || {};

      if (data?.comment) {
        setComments((previous) => [
          data.comment,
          ...previous,
        ]);
      }

      setCommentText("");

      const newCommentsCount =
        Number(
          data?.commentsCount
        );

      setShorts((previous) =>
        previous.map((video) =>
          video?._id === videoId
            ? {
                ...video,
                commentsCount:
                  Number.isFinite(
                    newCommentsCount
                  )
                    ? newCommentsCount
                    : Number(
                        video.commentsCount ||
                          0
                      ) + 1,
              }
            : video
        )
      );

      // Update commentVideo count too
      setCommentVideo((previous) =>
        previous
          ? {
              ...previous,
              commentsCount:
                Number.isFinite(
                  newCommentsCount
                )
                  ? newCommentsCount
                  : Number(
                      previous.commentsCount ||
                        0
                    ) + 1,
            }
          : previous
      );
    } catch (err) {
      console.error(
        "Add comment error:",
        err
      );

      if (
        err?.response?.status === 401
      ) {
        navigate("/auth");
      } else {
        alert(
          err?.response?.data?.message ||
            "Unable to add comment."
        );
      }
    } finally {
      setCommentSubmitting(false);
    }
  };

  // =========================================================
  // FOLLOW
  // =========================================================

  const handleFollow = async (
    creatorId
  ) => {
    if (!creatorId) return;

    if (
      currentUserId &&
      String(creatorId) ===
        String(currentUserId)
    ) {
      return;
    }

    // If not logged in
    if (!currentUserId) {
      navigate("/auth");
      return;
    }

    const isCurrentlyFollowing =
      !!following[creatorId];

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(
          creatorId
        );

        setFollowing((previous) => ({
          ...previous,
          [creatorId]: false,
        }));
      } else {
        await followUser(
          creatorId
        );

        setFollowing((previous) => ({
          ...previous,
          [creatorId]: true,
        }));
      }
    } catch (err) {
      console.error(
        "Follow action error:",
        err
      );

      if (
        err?.response?.status === 401
      ) {
        navigate("/auth");
      }
    }
  };

  // =========================================================
  // SHARE
  // =========================================================

  const handleShare = async (
    video
  ) => {
    const videoId = video?._id;

    if (!videoId) return;

    const url =
      `${window.location.origin}/video/${videoId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            video?.title ||
            "AnAR Short",

          text:
            "Check out this Short on AnAR",

          url,
        });
      } else {
        await navigator.clipboard.writeText(
          url
        );

        alert("Short link copied!");
      }
    } catch (err) {
      console.log(
        "Share cancelled."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="shorts-page shorts-loading">
        <div className="shorts-spinner">
          <RefreshCw size={28} />
        </div>

        <p>Loading Shorts...</p>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="shorts-page">
        <div className="shorts-empty">
          <div className="shorts-empty-icon">
            <Play size={30} />
          </div>

          <h2>
            Unable to load Shorts
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="shorts-primary-button"
            onClick={loadShorts}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // NO SHORTS
  // =========================================================

  if (!shorts.length) {
    return (
      <div className="shorts-page">
        <div className="shorts-empty">
          <div className="shorts-empty-icon">
            <Play size={30} />
          </div>

          <h2>No Shorts yet</h2>

          <p>
            Upload a vertical 9:16 video
            and it will appear here.
          </p>

          <button
            type="button"
            className="shorts-primary-button"
            onClick={() =>
              navigate("/create")
            }
          >
            Create Short
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN SHORTS
  // =========================================================

  return (
    <div className="shorts-page">

      <div
        className="shorts-feed"
        ref={feedRef}
        onScroll={handleShortsScroll}
      >
        {shorts.map((short, index) => {
          if (
            short?.type !== "short"
          ) {
            return null;
          }

          const videoId =
            short?._id;

          const videoUrl =
            short?.videoUrl ||
            short?.url;

          const {
            creator,
            creatorId,
            creatorName,
            creatorUsername,
          } = getCreator(short);

          const isFollowing =
            !!following[creatorId];

          const isSelf =
            currentUserId &&
            creatorId &&
            String(currentUserId) ===
              String(creatorId);

          const isActive =
            activeVideo === videoId;

          const isLiked =
            !!likedVideos[videoId];

          const isLikeLoading =
            !!likeLoading[videoId];

          return (
            <article
              className="short-item"
              key={videoId}
              data-video-id={videoId}
              ref={(element) => {
                if (element) {
                  shortItemRefs.current[
                    index
                  ] = element;
                } else {
                  delete shortItemRefs.current[
                    index
                  ];
                }
              }}
            >
              <div className="short-video-wrapper">

                {/* VIDEO */}

                <video
                  ref={(element) => {
                    if (element) {
                      videoRefs.current[
                        videoId
                      ] = element;

                      element.playsInline =
                        true;

                      element.muted =
                        activeVideoRef.current ===
                        videoId
                          ? muted
                          : true;
                    } else {
                      delete videoRefs.current[
                        videoId
                      ];
                    }
                  }}
                  data-video-id={videoId}
                  className="short-video"
                  src={videoUrl}
                  loop
                  muted={
                    isActive
                      ? muted
                      : true
                  }
                  playsInline
                  preload="auto"
                  onClick={(event) =>
                    handleVideoClick(
                      event,
                      videoId
                    )
                  }
                />

                <div className="short-top-gradient" />

                {/* CREATOR */}

                <div className="short-creator">

                  <button
                    type="button"
                    className="short-avatar"
                    onClick={() =>
                      creatorId &&
                      navigate(
                        `/profile/${creatorId}`
                      )
                    }
                  >
                    {creator?.avatar ? (
                      <img
                        src={
                          creator.avatar
                        }
                        alt={
                          creatorName
                        }
                      />
                    ) : (
                      creatorName
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </button>

                  <button
                    type="button"
                    className="short-creator-info"
                    onClick={() =>
                      creatorId &&
                      navigate(
                        `/profile/${creatorId}`
                      )
                    }
                  >
                    <strong>
                      {creatorName}
                    </strong>

                    {creatorUsername && (
                      <span>
                        @
                        {
                          creatorUsername
                        }
                      </span>
                    )}
                  </button>

                  {!isSelf &&
                    creatorId && (
                      <button
                        type="button"
                        className={
                          isFollowing
                            ? "short-follow following"
                            : "short-follow"
                        }
                        onClick={() =>
                          handleFollow(
                            creatorId
                          )
                        }
                      >
                        {isFollowing ? (
                          <>
                            <Check
                              size={14}
                            />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus
                              size={14}
                            />
                            Follow
                          </>
                        )}
                      </button>
                    )}
                </div>

                {/* ACTIONS */}

                <div className="short-actions">

                  {/* LIKE */}

                  <button
                    type="button"
                    className={
                      isLiked
                        ? "short-action liked"
                        : "short-action"
                    }
                    onClick={() =>
                      handleLike(
                        videoId
                      )
                    }
                    disabled={
                      isLikeLoading
                    }
                    aria-label={
                      isLiked
                        ? "Unlike"
                        : "Like"
                    }
                  >
                    <Heart
                      size={26}
                      fill={
                        isLiked
                          ? "currentColor"
                          : "none"
                      }
                    />

                    <span>
                      {formatNumber(
                        short?.likesCount
                      )}
                    </span>
                  </button>

                  {/* COMMENT */}

                  <button
                    type="button"
                    className="short-action"
                    onClick={() =>
                      handleOpenComments(
                        short
                      )
                    }
                    aria-label="Comments"
                  >
                    <MessageCircle
                      size={26}
                    />

                    <span>
                      {formatNumber(
                        short?.commentsCount
                      )}
                    </span>
                  </button>

                  {/* SHARE */}

                  <button
                    type="button"
                    className="short-action"
                    onClick={() =>
                      handleShare(
                        short
                      )
                    }
                  >
                    <Share2
                      size={26}
                    />

                    <span>
                      Share
                    </span>
                  </button>

                  {/* SOUND */}

                  <button
                    type="button"
                    className="short-action"
                    onClick={
                      toggleMute
                    }
                  >
                    {muted ? (
                      <VolumeX
                        size={26}
                      />
                    ) : (
                      <Volume2
                        size={26}
                      />
                    )}

                    <span>
                      {muted
                        ? "Muted"
                        : "Sound"}
                    </span>
                  </button>
                </div>

                <div className="short-bottom-gradient" />

                {/* INFO */}

                <div className="short-info">

                  <h2>
                    {short?.title ||
                      "Untitled Short"}
                  </h2>

                  {short?.description && (
                    <p>
                      {
                        short.description
                      }
                    </p>
                  )}

                  <span className="short-views">
                    {formatNumber(
                      short?.views
                    )}{" "}
                    views
                  </span>
                </div>

                {/* PLAYING INDICATOR */}

                {isActive && (
                  <div className="short-playing-indicator">
                    <Play
                      size={14}
                      fill="currentColor"
                    />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* =====================================================
          COMMENTS BOTTOM SHEET
      ===================================================== */}

      {commentVideo && (
        <div
          className="comments-overlay"
          onClick={handleCloseComments}
        >
          <div
            className="comments-sheet"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="comments-header">
              <div>
                <h3>Comments</h3>

                <span>
                  {formatNumber(
                    commentVideo?.commentsCount
                  )}{" "}
                  comments
                </span>
              </div>

              <button
                type="button"
                className="comments-close"
                onClick={
                  handleCloseComments
                }
                aria-label="Close comments"
              >
                <X size={22} />
              </button>
            </div>

            {/* COMMENTS LIST */}

            <div className="comments-list">

              {commentsLoading ? (
                <div className="comments-state">
                  <RefreshCw
                    size={24}
                    className="comments-loading-icon"
                  />
                  <p>
                    Loading comments...
                  </p>
                </div>
              ) : comments.length === 0 ? (
                <div className="comments-state">
                  <MessageCircle
                    size={30}
                  />
                  <p>
                    No comments yet.
                  </p>

                  <span>
                    Be the first to comment.
                  </span>
                </div>
              ) : (
                comments.map((comment) => {
                  const commentUser =
                    comment?.user ||
                    {};

                  const name =
                    commentUser?.name ||
                    commentUser?.username ||
                    "AnAR User";

                  return (
                    <div
                      className="comment-item"
                      key={
                        comment?._id
                      }
                    >
                      <div className="comment-avatar">
                        {commentUser?.avatar ? (
                          <img
                            src={
                              commentUser.avatar
                            }
                            alt={name}
                          />
                        ) : (
                          name
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      <div className="comment-content">
                        <strong>
                          {name}
                        </strong>

                        {commentUser?.username && (
                          <span className="comment-username">
                            @
                            {
                              commentUser.username
                            }
                          </span>
                        )}

                        <p>
                          {comment?.text}
                        </p>

                        {comment?.createdAt && (
                          <small>
                            {new Date(
                              comment.createdAt
                            ).toLocaleString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </small>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* COMMENT INPUT */}

            <div className="comment-input-area">
              <input
                type="text"
                value={commentText}
                onChange={(event) =>
                  setCommentText(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    handleSubmitComment();
                  }
                }}
                placeholder={
                  currentUserId
                    ? "Add a comment..."
                    : "Login to comment..."
                }
                maxLength={1000}
                disabled={
                  commentSubmitting
                }
              />

              <button
                type="button"
                className="comment-send-button"
                onClick={
                  handleSubmitComment
                }
                disabled={
                  !commentText.trim() ||
                  commentSubmitting
                }
                aria-label="Post comment"
              >
                {commentSubmitting ? (
                  <RefreshCw
                    size={20}
                    className="comments-loading-icon"
                  />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shorts;