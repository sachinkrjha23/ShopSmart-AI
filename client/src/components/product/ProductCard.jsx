import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import StarRating from "../ui/StarRating";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import useCart from "../../hooks/useCart";
import WishlistButton from "../wishlist/WishlistButton";

const ProductCard = ({ product }) => {
  const productImage = product.images?.[0]?.url || null;
  const isInStock = product.stock > 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const { addItem, decreaseQuantity, isInCart, getItemQuantity } = useCart();

  const cartQuantity = getItemQuantity(product.id);
  const cap = Math.min(product.stock ?? 100, 100);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isInStock) return toast.error("Product is out of stock");
    addItem(product);
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    decreaseQuantity(product.id);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-teal-200">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {!isInStock && <Badge label="Out of Stock" variant="danger" />}
            {isLowStock && isInStock && (
              <Badge label="Low Stock" variant="warning" />
            )}
            {product.ratings >= 4.5 && isInStock && (
              <Badge label="Top Rated" variant="new" />
            )}
          </div>

          <div className="absolute top-3 right-3">
            <WishlistButton productId={product.id} variant="overlay" />
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-sm font-medium text-gray-800 hover:text-teal-600 transition-colors line-clamp-2 min-h-10">
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-xs text-gray-500 mt-1 capitalize">
            {product.category}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={product.ratings || 0} size="sm" />
          <span className="text-xs text-gray-500">
            ({product.review_count || 0})
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm sm:text-lg font-bold text-teal-600 truncate min-w-0">
            {formatPrice(product.price)}
          </span>

          {isInCart(product.id) ? (
            <div className="flex items-center border border-gray-200 rounded-lg shrink-0">
              <button
                type="button"
                onClick={handleDecrease}
                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-6 text-center text-xs font-medium">
                {cartQuantity}
              </span>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={cartQuantity >= cap}
                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              disabled={!isInStock}
              className="px-2.5 py-1.5 !text-[11px] sm:!text-xs shrink-0 whitespace-nowrap gap-1"
            >
              {!isInStock ? (
                "Out of Stock"
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm7 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Add to Cart</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
