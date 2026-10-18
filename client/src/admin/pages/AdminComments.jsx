import React, {
  useEffect,
  useState,
} from "react";

import {
  MessageSquare,
  Trash2,
} from "lucide-react";

import {
  getAdminComments,
  deleteAdminComment,
} from "../../services/adminApi";

import "../admin.css";

const AdminComments = () => {
  const [comments, setComments] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [pages, setPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const loadComments = async (
    requestedPage = page
  ) => {
    try {
      setLoading(true);

      const response =
        await getAdminComments({
          page: requestedPage,
          limit: 10,
        });

      const data =
        response.data?.data ||
        response.data;

      setComments(
        data.comments || []
      );

      setPages(
        data.pages || 1
      );
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load comments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments(page);
  }, [page]);

  const handleDelete = async (
    comment
  ) => {
    const confirmed =
      window.confirm(
        "Delete this comment permanently?"
      );

    if (!confirmed) return;

    try {
      await deleteAdminComment(
        comment._id
      );

      await loadComments(page);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete comment."
      );
    }
  };

  return (
    <div className="admin-page">

      <div className="admin-page-header">
        <div>
          <h1>Comments</h1>

          <p>
            Review and moderate
            comments posted on AnAR.
          </p>
        </div>
      </div>

      <section className="admin-panel">

        {loading ? (
          <div className="admin-loading">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="admin-empty">
            <MessageSquare size={35} />
            <p>
              No comments found.
            </p>
          </div>
        ) : (
          <div className="admin-comments-list">

            {comments.map(
              (comment) => (
                <div
                  className="admin-comment-card"
                  key={comment._id}
                >

                  <div className="admin-comment-avatar">
                    {(
                      comment.user?.name ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="admin-comment-content">

                    <div className="admin-comment-top">

                      <strong>
                        {comment.user?.name ||
                          "Unknown User"}
                      </strong>

                      <span>
                        {comment.user
                          ?.username
                          ? `@${comment.user.username}`
                          : ""}
                      </span>

                    </div>

                    <p>
                      {comment.text ||
                        comment.content ||
                        comment.comment ||
                        "Comment"}
                    </p>

                    <small>
                      Video:{" "}
                      {comment.video
                        ?.title ||
                        "Unknown Video"}
                    </small>

                  </div>

                  <button
                    type="button"
                    className="admin-action-danger"
                    onClick={() =>
                      handleDelete(
                        comment
                      )
                    }
                    title="Delete comment"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>
              )
            )}

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

export default AdminComments;