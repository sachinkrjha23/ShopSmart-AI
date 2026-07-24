import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { requestReturn } from "../../store/slices/returnSlice";

const RequestReturnModal = ({ isOpen, onClose, orderItemId, productTitle, onSuccess }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.returns);
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return toast.error("Please tell us why you're returning this item.");
    try {
      await dispatch(requestReturn({ orderItemId, reason: reason.trim() })).unwrap();
      toast.success("Return request submitted.");
      setReason("");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err || "Failed to submit return request");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Request Return${productTitle ? ` — ${productTitle}` : ""}`}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for return</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Item damaged, wrong size, not as described..."
            rows={4}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Return Request"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RequestReturnModal;