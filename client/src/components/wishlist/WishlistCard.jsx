import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import StarRating from "../ui/StarRating";
import Button from "../ui/Button";
import { removeFromWishlist } from "../../store/slices/wishlistSlice";
import useCart from "../../hooks/useCart";

const WishlistCard = ({ item }) => {
  const dispatch = useDispatch();
  const { addItem, isInCart } = useCart();

  const isInStock = item.stock > 0;
  const productImage = item.images?.[0]?.url || null;

  const handleRemove = async () => {
    try {
      await dispatch(removeFromWishlist(item.product_id)).unwrap();
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(err || "Failed to remove from wishlist");
    }
  };

  const handleAddToCart = () => {
    if (!isInStock) return toast.error("Product is out of stock");
    addItem({
      id: item.product_id,
      name: item.name,
      images: item.images,
      price: item.price,
      stock: item.stock,
    });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4">
      <Link to={`/products/${item.product_id}`} className="shrink-0">
        <div className="h-24 w-24 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
          {productImage ? (
            <img
              src={productImage}
              alt={item.name}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
              No image
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 flex flex-col">
        <Link to={`/products/${item.product_id}`}>
          <h3 className="text-sm font-medium text-gray-800 hover:text-teal-600 transition-colors line-clamp-2">
            {item.name}
          </h3>
        </Link>

        {item.category && (
          <p className="text-xs text-gray-500 mt-1 capitalize">
            {item.category}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={item.ratings || 0} size="sm" />
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-base font-bold text-teal-600">
            {formatPrice(item.price)}
          </span>
          {!isInStock && (
            <span className="text-xs font-medium text-red-500">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between items-end gap-2">
        <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-semibold text-gray-600 hover:text-red-500 transition-colors"
            aria-label="Remove from wishlist"
        >
            Remove
        </button>
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={!isInStock || isInCart(item.product_id)}
          className="px-3 py-1.5 text-xs whitespace-nowrap"
        >
          {isInCart(item.product_id)
            ? "In Cart"
            : isInStock
              ? "Add to Cart"
              : "Out of Stock"}
        </Button>
      </div>
    </div>
  );
};

export default WishlistCard;
