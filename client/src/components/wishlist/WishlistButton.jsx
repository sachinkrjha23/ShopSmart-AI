import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../store/slices/wishlistSlice";
import { openLoginModal } from "../../store/slices/uiSlice";

const HeartIcon = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill={filled ? "currentColor" : "none"}
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const VARIANTS = {
  overlay:
    "h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white",
  button: "px-4 py-3 border border-gray-200 rounded-xl hover:border-red-200",
};

const WishlistButton = ({ productId, variant = "button", className = "" }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items, loading } = useSelector((state) => state.wishlist);

  const isWishlisted = items.some((item) => item.product_id === productId);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to use your wishlist.");
      dispatch(openLoginModal());
      return;
    }

    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        toast.success("Removed from wishlist");
      } else {
        await dispatch(addToWishlist(productId)).unwrap();
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error(err || "Something went wrong");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${
        isWishlisted ? "text-red-500" : "text-gray-500 hover:text-red-500"
      } ${className}`}
    >
      <HeartIcon filled={isWishlisted} />
    </button>
  );
};

export default WishlistButton;
