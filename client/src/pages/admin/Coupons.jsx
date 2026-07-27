import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchAdminCoupons,
  toggleAdminCoupon,
  deleteAdminCoupon,
} from "../../store/slices/couponSlice";
import CouponModal from "../../components/admin/CouponModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import TableSkeleton from '../../components/ui/TableSkeleton'
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Tooltip from '../../components/ui/Tooltip'

const STATUS_VARIANTS = {
  Active: "success",
  Inactive: "default",
  Upcoming: "info",
  Expired: "danger",
  Exhausted: "warning",
};

// Shown when deleting a coupon that's already been used — deleting cascades
// away its usage history (coupon_usage.coupon_id ON DELETE CASCADE), so we
// steer the admin toward deactivating instead, but still allow a real delete.
const UsedCouponWarningModal = ({
  coupon,
  onClose,
  onDeactivate,
  onDeleteAnyway,
}) => {
  if (!coupon) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          This coupon has been used
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          <span className="font-medium text-gray-800">{coupon.code}</span> has
          been used {coupon.used_count} time{coupon.used_count === 1 ? "" : "s"}
          . Deleting it will permanently remove that usage history — orders that
          used it will keep their discount amount, but you'll lose the record of
          who used it and when.
          {coupon.is_active && (
            <>
              {" "}
              We recommend deactivating it instead, which stops further use
              while keeping the history.
            </>
          )}
        </p>
        <div className="flex flex-col gap-2">
          {coupon.is_active && (
            <Button variant="secondary" onClick={onDeactivate} fullWidth>
              Deactivate Instead
            </Button>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDeleteAnyway}>
              Delete Anyway
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminCoupons = () => {
  const dispatch = useDispatch();
  const { adminCoupons, loading } = useSelector((state) => state.coupon);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [usedDeleteTarget, setUsedDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminCoupons());
  }, [dispatch]);

  const handleAddNew = () => {
    setEditingCoupon(null);
    setModalOpen(true);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setModalOpen(true);
  };

  // Re-fetch after save/toggle so the derived `status` field (computed only
  // in the list query, not in create/update/toggle's RETURNING *) stays accurate
  const handleSaved = () => {
    dispatch(fetchAdminCoupons());
  };

  const handleToggle = async (id) => {
    try {
      const result = await dispatch(toggleAdminCoupon(id)).unwrap();
      toast.success(result.message);
      dispatch(fetchAdminCoupons());
    } catch (err) {
      toast.error(err || "Failed to update coupon");
    }
  };

  // Routes to the plain confirm dialog for never-used coupons, or the
  // warning modal for coupons with usage history.
  const handleDeleteClick = (coupon) => {
    if (coupon.used_count > 0) {
      setUsedDeleteTarget(coupon);
    } else {
      setDeleteTarget(coupon.id);
    }
  };

  const handleDeleteConfirm = async () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await dispatch(deleteAdminCoupon(id)).unwrap();
      toast.success("Coupon deleted successfully.");
    } catch (err) {
      toast.error(err || "Failed to delete coupon");
    }
  };

  const handleDeactivateFromWarning = async () => {
    const id = usedDeleteTarget.id;
    setUsedDeleteTarget(null);
    try {
      const result = await dispatch(toggleAdminCoupon(id)).unwrap();
      toast.success(result.message);
      dispatch(fetchAdminCoupons());
    } catch (err) {
      toast.error(err || "Failed to update coupon");
    }
  };

  const handleDeleteAnyway = async () => {
    const id = usedDeleteTarget.id;
    setUsedDeleteTarget(null);
    try {
      await dispatch(deleteAdminCoupon(id)).unwrap();
      toast.success("Coupon deleted successfully.");
    } catch (err) {
      toast.error(err || "Failed to delete coupon");
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id)
    toast.success('Coupon ID copied to clipboard.')
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Button onClick={handleAddNew}>+ Create Coupon</Button>
      </div>

      {loading && adminCoupons.length === 0 ? (
        <TableSkeleton columns={6} />
      ) : adminCoupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No coupons yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Valid Period</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{coupon.code}</p>
                    <Tooltip text={coupon.id}>
                      <button
                        type="button"
                        onClick={() => handleCopyId(coupon.id)}
                        className="text-xs text-gray-400 hover:text-teal-600 transition-colors"
                      >
                        #{coupon.id.slice(0, 8).toUpperCase()}
                      </button>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {coupon.type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `₹${coupon.discount_value}`}
                    {coupon.max_discount && (
                      <span className="text-xs text-gray-400">
                        {" "}
                        (max ₹{coupon.max_discount})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {coupon.used_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(coupon.valid_from)} –{" "}
                    {formatDate(coupon.valid_until)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={coupon.status}
                      variant={STATUS_VARIANTS[coupon.status] || "default"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(coupon)}
                        className="text-teal-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(coupon.id)}
                        className={
                          coupon.is_active
                            ? "text-amber-600 hover:underline"
                            : "text-green-600 hover:underline"
                        }
                      >
                        {coupon.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(coupon)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CouponModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        coupon={editingCoupon}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon"
        message="This will permanently delete this coupon. This cannot be undone."
        confirmLabel="Delete Coupon"
        variant="danger"
      />

      <UsedCouponWarningModal
        coupon={usedDeleteTarget}
        onClose={() => setUsedDeleteTarget(null)}
        onDeactivate={handleDeactivateFromWarning}
        onDeleteAnyway={handleDeleteAnyway}
      />
    </div>
  );
};

export default AdminCoupons;
