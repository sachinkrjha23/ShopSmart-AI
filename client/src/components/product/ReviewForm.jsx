import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  submitReview,
  removeReview,
  fetchProduct,
} from "../../store/slices/productSlice";
import StarRating from "../ui/StarRating";
import Button from "../ui/Button";

const ReviewForm = ({ productId, existingReview }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(existingReview?.rating || 0);
    setComment(existingReview?.comment || "");
  }, [existingReview]);

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-indigo-600 hover:underline font-medium"
        >
          Log in
        </button>{" "}
        to write a review.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a star rating");

    setSubmitting(true);
    try {
      await dispatch(
        submitReview({ productId, reviewData: { rating, comment } }),
      ).unwrap();
      toast.success(
        existingReview
          ? "Review updated successfully."
          : "Review submitted successfully.",
      );
      dispatch(fetchProduct(productId));
    } catch (err) {
      toast.error(err || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(removeReview(productId)).unwrap();
      toast.success("Review deleted.");
      dispatch(fetchProduct(productId));
    } catch (err) {
      toast.error(err || "Failed to delete review");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-3"
    >
      <p className="text-sm font-medium text-gray-800">
        {existingReview ? "Update your review" : "Write a review"}
      </p>
      <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts about this product (optional)"
        rows={3}
        maxLength={500}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 resize-none"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {existingReview ? "Update Review" : "Submit Review"}
        </Button>
        {existingReview && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-500 hover:underline text-sm"
          >
            Delete My Review
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
