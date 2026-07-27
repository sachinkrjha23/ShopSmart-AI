import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchSellerCoupons,
  toggleSellerCouponStatus,
  removeSellerCoupon,
} from "../../store/slices/sellerSlice";
import SellerCouponModal from "../../components/seller/SellerCouponModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import TableSkeleton from '../../components/ui/TableSkeleton'

import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Tooltip from "../../components/ui/Tooltip";

const STATUS_VARIANTS = {
  Active: "success",
  Inactive: "default",
  Upcoming: "info",
  Expired: "danger",
  Exhausted: "warning",
};

const SellerCoupons = () => {
  const dispatch = useDispatch();
  const { sellerCoupons, loading } = useSelector((state) => state.seller);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchSellerCoupons());
  }, [dispatch]);

  const handleAddNew = () => {
    setEditingCoupon(null);
    setModalOpen(true);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setModalOpen(true);
  };

  const handleSaved = () => {
    dispatch(fetchSellerCoupons());
  };

  const handleToggle = async (id) => {
    try {
      const result = await dispatch(toggleSellerCouponStatus(id)).unwrap();
      toast.success(result.message);
      dispatch(fetchSellerCoupons());
    } catch (err) {
      toast.error(err || "Failed to update coupon");
    }
  };

  const handleDeleteConfirm = async () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await dispatch(removeSellerCoupon(id)).unwrap();
      toast.success("Coupon deleted successfully.");
    } catch (err) {
      toast.error(err || "Failed to delete coupon");
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success("Coupon ID copied to clipboard.");
  };

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

      {loading && sellerCoupons.length === 0 ? (
        <TableSkeleton columns={6} />
      ) : sellerCoupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No coupons yet. Create one to offer a discount on your own products.
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
              {sellerCoupons.map((coupon) => (
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
                        onClick={() => setDeleteTarget(coupon.id)}
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

      <SellerCouponModal
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
    </div>
  );
};

export default SellerCoupons;