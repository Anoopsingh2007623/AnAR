import React, {
  useEffect,
  useState,
} from "react";

import {
  Search,
  Ban,
  CheckCircle,
  Trash2,
} from "lucide-react";

import {
  getAdminUsers,
  toggleAdminUserBlock,
  deleteAdminUser,
} from "../../services/adminApi";

import "../admin.css";

const AdminUsers = () => {
  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pages, setPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const loadUsers = async (
    requestedPage = page,
    requestedSearch = search
  ) => {
    try {
      setLoading(true);

      const response =
        await getAdminUsers({
          search: requestedSearch,
          page: requestedPage,
          limit: 10,
        });

      const data =
        response.data?.data ||
        response.data;

      setUsers(data.users || []);
      setPages(data.pages || 1);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(page, search);
  }, [page]);

  const handleSearch = async (e) => {
    e.preventDefault();

    setPage(1);

    await loadUsers(1, search);
  };

  const handleBlock = async (user) => {
    const action = user.isBlocked
      ? "unblock"
      : "block";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} @${user.username}?`
      );

    if (!confirmed) return;

    try {
      await toggleAdminUserBlock(
        user._id
      );

      await loadUsers(page, search);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          `Failed to ${action} user.`
      );
    }
  };

  const handleDelete = async (user) => {
    const confirmed =
      window.confirm(
        `Delete @${user.username}? This will permanently delete the user and their videos.`
      );

    if (!confirmed) return;

    try {
      await deleteAdminUser(
        user._id
      );

      await loadUsers(page, search);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete user."
      );
    }
  };

  return (
    <div className="admin-page">

      <div className="admin-page-header">
        <div>
          <h1>Users</h1>

          <p>
            Manage AnAR users and
            account access.
          </p>
        </div>
      </div>

      <section className="admin-panel">

        {/* Search */}
        <form
          className="admin-search-container"
          onSubmit={handleSearch}
        >
          <div className="admin-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search name, username or email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <button type="submit">
              Search
            </button>
          </div>
        </form>

        {/* Table */}
        {loading ? (
          <div className="admin-loading">
            Loading users...
          </div>
        ) : users.length === 0 ? (
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
                  <th>Followers</th>
                  <th>Following</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>

                    <td>
                      <div className="admin-user-cell">

                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="admin-table-avatar"
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
                      {user.followersCount ||
                        0}
                    </td>

                    <td>
                      {user.followingCount ||
                        0}
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

                    <td>
                      {user.createdAt
                        ? new Date(
                            user.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <div className="admin-actions">

                        <button
                          type="button"
                          className={
                            user.isBlocked
                              ? "admin-action-success"
                              : "admin-action-warning"
                          }
                          onClick={() =>
                            handleBlock(user)
                          }
                          title={
                            user.isBlocked
                              ? "Unblock user"
                              : "Block user"
                          }
                        >
                          {user.isBlocked ? (
                            <CheckCircle
                              size={18}
                            />
                          ) : (
                            <Ban size={18} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="admin-action-danger"
                          onClick={() =>
                            handleDelete(user)
                          }
                          title="Delete user"
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

export default AdminUsers;