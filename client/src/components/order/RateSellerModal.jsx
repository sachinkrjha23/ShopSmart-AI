import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { submitSellerRating, fetchMySellerRating } from "../../store/slices/sellerSlice";

const RateSellerModal = ({ isOpen, onClose, sellerId, sellerName }) => {
  const dispatch = useDispatch();
  const { myRating, loading } = useSelector((state) => state.seller);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    if (isOpen && sellerId) {
      dispatch(fetchMySellerRating(sellerId));
    }
  }, [isOpen, sellerId, dispatch]);

  useEffect(() => {
    if (isOpen) {
      setRating(myRating?.rating ? Math.round(myRating.rating) : 0);
      setReview(myRating?.review || "");
    }
  }, [isOpen, myRating]);

  const handleSubmit = async () => {
    if (rating < 1) return toast.error("Please select a star rating.");
    try {
      await dispatch(
        submitSellerRating({ sellerId, data: { rating, review: review.trim() || null } }),
      ).unwrap();
      toast.success("Thanks for rating this seller!");
      onClose();
    } catch (err) {
      toast.error(err || "Failed to submit rating");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Rate ${sellerName || "this seller"}`} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl leading-none transition-colors"
            >
              <span
                className={
                  star <= (hoverRating || rating) ? "text-amber-400" : "text-gray-200"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this seller (optional)"
          rows={3}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none"
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : myRating ? "Update Rating" : "Submit Rating"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RateSellerModal;