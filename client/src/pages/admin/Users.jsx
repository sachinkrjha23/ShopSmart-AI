import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { fetchAllUsers, deleteUser } from "../../store/slices/adminSlice";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Pagination from "../../components/ui/Pagination";
import TableSkeleton from "../../components/ui/TableSkeleton";

const avatarColors = [
  "bg-teal-100 text-teal-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-600",
  "bg-rose-100 text-rose-600",
];

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, totalUsers, currentPage, loading } = useSelector(
    (state) => state.admin,
  );
  const { user: currentUser } = useSelector((state) => state.auth);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewingRole, setViewingRole] = useState("User");
  const [adminSecretInput, setAdminSecretInput] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalUsers / 10));

  useEffect(() => {
    dispatch(fetchAllUsers({ page: 1, role: viewingRole }));
  }, [dispatch, viewingRole]);

  const handlePageChange = (page) => {
    dispatch(fetchAllUsers({ page, role: viewingRole }));
  };

  const handleTabChange = (role) => {
    setViewingRole(role);
  };

  const deleteTargetUser = users.find((u) => u.id === deleteTarget);
  const isDeletingAdmin = deleteTargetUser?.role === "Admin";

  const handleDeleteConfirm = async () => {
    const id = deleteTarget;
    const secret = adminSecretInput;
    setDeleteTarget(null);
    setAdminSecretInput("");
    try {
      await dispatch(
        deleteUser({ id, adminSecret: isDeletingAdmin ? secret : undefined }),
      ).unwrap();
      toast.success("User deleted successfully.");
      // refresh current tab so the deleted row disappears immediately
      dispatch(fetchAllUsers({ page: currentPage, role: viewingRole }));
    } catch (err) {
      toast.error(err || "Failed to delete user");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => handleTabChange("User")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              viewingRole === "User"
                ? "bg-teal-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Buyers
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("Admin")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
              viewingRole === "Admin"
                ? "bg-teal-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Admins
          </button>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <TableSkeleton columns={5} />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No {viewingRole === "Admin" ? "admin accounts" : "users"} found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const avatarUrl = user.avatar?.url || null;
                const initials = getInitials(user.name);

                return (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${avatarColors[index % avatarColors.length]}`}
                          >
                            {initials}
                          </div>
                        )}
                        <span className="font-medium text-gray-800">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={
                          user.is_email_verified ? "Verified" : "Unverified"
                        }
                        variant={user.is_email_verified ? "success" : "default"}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.id === currentUser?.id ? (
                        <span
                          className="text-gray-300 cursor-not-allowed"
                          title="You can't delete your own account here — use Settings → Delete Account instead"
                        >
                          Delete
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setAdminSecretInput("");
        }}
        onConfirm={handleDeleteConfirm}
        title={isDeletingAdmin ? "Delete Admin Account" : "Delete User"}
        message={
          isDeletingAdmin
            ? "This will permanently anonymize this admin's account. This cannot be undone. Enter your admin security secret to confirm."
            : "This will permanently anonymize this user's account and personal data. Their past orders will be kept for records but no longer tied to an active account. This cannot be undone."
        }
        confirmLabel="Delete"
        variant="danger"
        confirmDisabled={isDeletingAdmin && adminSecretInput.length === 0}
      >
        {isDeletingAdmin && (
          <input
            type="password"
            value={adminSecretInput}
            onChange={(e) => setAdminSecretInput(e.target.value)}
            placeholder="Your admin security secret"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            autoFocus
          />
        )}
      </ConfirmDialog>
    </div>
  );
};

export default AdminUsers;
