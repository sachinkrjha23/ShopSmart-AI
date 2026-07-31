import { useState } from "react";
import { toast } from "react-hot-toast";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import Modal from "../ui/Modal";
import Loader from "../ui/Loader";

const STATUS_TABS = ["Pending", "Approved", "Rejected", "All"];
const STATUS_VARIANTS = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
};

const ReturnRequestList = ({ returns, loading, activeTab, onTabChange, onResolve, onRetryRefund }) => {
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const handleApproveConfirm = async () => {
    const returnId = approveTarget;
    setApproveTarget(null);
    setResolvingId(returnId);
    try {
      await onResolve(returnId, "Approve");
      toast.success("Return approved.");
    } catch (err) {
      toast.error(err || "Failed to approve return");
    } finally {
      setResolvingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return toast.error("A reason is required to reject a return.");
    const returnId = rejectTarget;
    setResolvingId(returnId);
    try {
      await onResolve(returnId, "Reject", rejectReason.trim());
      toast.success("Return rejected.");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err || "Failed to reject return");
    } finally {
      setResolvingId(null);
    }
  };

  const handleRetryRefund = async (returnId) => {
    setRetryingId(returnId);
    try {
      const result = await onRetryRefund(returnId);
      toast.success(result?.message || "Refund issued.");
    } catch (err) {
      toast.error(err || "Failed to issue refund");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 border-b border-gray-100">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-teal-600 text-teal-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && returns.length === 0 ? (
        <div className="flex justify-center py-10"><Loader /></div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">No return requests found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((rr) => (
                <tr key={rr.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{rr.product_name}</p>
                    <p className="text-xs text-gray-400">Qty: {rr.quantity} · ₹{(Number(rr.price) * rr.quantity).toLocaleString("en-IN")}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{rr.buyer_name}</p>
                    <p className="text-xs text-gray-400">{rr.buyer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">{rr.reason}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(rr.requested_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3"><Badge label={rr.status} variant={STATUS_VARIANTS[rr.status]} /></td>
                  <td className="px-4 py-3 text-right">
                    {rr.status === "Pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resolvingId === rr.id}
                          onClick={() => setApproveTarget(rr.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={resolvingId === rr.id}
                          onClick={() => { setRejectTarget(rr.id); setRejectReason(""); }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        <p className="text-xs text-gray-400">
                          {rr.admin_notes ? `Note: ${rr.admin_notes}` : "—"}
                          {rr.refund_amount ? ` · Refunded ₹${Number(rr.refund_amount).toLocaleString("en-IN")}` : ""}
                        </p>
                        {rr.status === "Approved" && !rr.refund_amount && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={retryingId === rr.id}
                            onClick={() => handleRetryRefund(rr.id)}
                          >
                            {retryingId === rr.id ? "Issuing..." : "Retry Refund"}
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApproveConfirm}
        title="Approve Return"
        message="This will restock the item and issue a refund to the buyer. Continue?"
        confirmLabel="Approve"
        variant="primary"
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason(""); }}
        title="Reject Return Request"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Let the buyer know why this return isn't being accepted..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleRejectSubmit} disabled={resolvingId === rejectTarget}>
              {resolvingId === rejectTarget ? "Rejecting..." : "Reject Return"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReturnRequestList;