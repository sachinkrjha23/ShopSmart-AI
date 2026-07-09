import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { deleteAccount, logout } from "../../store/slices/authSlice";
import { setAdminSecret } from "../../api/authApi";
import ConfirmDialog from "../ui/ConfirmDialog";
import Input from "../ui/Input";
import Button from "../ui/Button";

const DeleteAccountSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "Admin";

  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecretInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newSecret, setNewSecret] = useState("");
  const [confirmNewSecret, setConfirmNewSecret] = useState("");
  const [settingSecret, setSettingSecret] = useState(false);

  const handleDeleteConfirm = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await dispatch(deleteAccount({ password, adminSecret })).unwrap();
      await dispatch(logout());
      toast.success("Your account has been deleted.");
      navigate("/");
    } catch (err) {
      toast.error(err || "Failed to delete account");
    } finally {
      setLoading(false);
      setPassword("");
      setAdminSecretInput("");
    }
  };

  const handleSetSecret = async (e) => {
    e.preventDefault();
    if (!newSecret || !confirmNewSecret) {
      toast.error("Please fill in both fields");
      return;
    }
    setSettingSecret(true);
    try {
      await setAdminSecret({
        secret: newSecret,
        confirmSecret: confirmNewSecret,
      });
      toast.success("Admin secret set successfully");
      setNewSecret("");
      setConfirmNewSecret("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set admin secret");
    } finally {
      setSettingSecret(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Admin Security Secret
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            A separate secret (distinct from your password) required to delete
            your own or another admin's account. Setting a new one overwrites
            any existing secret.
          </p>
          <form
            onSubmit={handleSetSecret}
            className="max-w-sm flex flex-col gap-3"
          >
            <Input
              label="New Admin Secret"
              type="password"
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              placeholder="At least 8 characters"
              disabled={settingSecret}
            />
            <Input
              label="Confirm Admin Secret"
              type="password"
              value={confirmNewSecret}
              onChange={(e) => setConfirmNewSecret(e.target.value)}
              disabled={settingSecret}
            />
            <div>
              <Button type="submit" disabled={settingSecret}>
                {settingSecret ? "Saving..." : "Set Admin Secret"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-red-100 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">
          Deleting your account is permanent. You will no longer be able to log
          in, and your personal info will be removed. Your past orders are kept
          for records but no longer tied to an active account.
        </p>

        <div className="max-w-sm flex flex-col gap-3">
          <Input
            label="Enter your password to confirm"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank if you signed up with Google"
            disabled={loading}
          />
          {isAdmin && (
            <Input
              label="Enter your admin security secret"
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecretInput(e.target.value)}
              disabled={loading}
            />
          )}
          <Button
            variant="danger"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete My Account"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Account"
        message="This action is permanent and cannot be undone. Are you absolutely sure you want to delete your account?"
        confirmLabel="Yes, Delete My Account"
        variant="danger"
      />
    </div>
  );
};

export default DeleteAccountSection;
