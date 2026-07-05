import { Link } from "react-router-dom";
import useCart from "../../hooks/useCart";
import Button from "../ui/Button";

const CartItem = ({ item }) => {

  const { decreaseQuantity, changeQuantity, removeItem } = useCart()

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const maxQty = Math.min(item.stock ?? 100, 100);
  const subtotal = item.price * item.quantity;

  const handleDecrease = () => {
    decreaseQuantity(item.productId)   
  }

  const handleIncrease = () => {
    if (item.quantity >= maxQty) return
    changeQuantity(item.productId, item.quantity + 1)
  }

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100">
      <Link to={`/products/${item.productId}`} className="shrink-0">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.productId}`}>
          <h3 className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2">
            {item.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-500 mt-1">
          {formatPrice(item.price)} each
        </p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={handleDecrease}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              disabled={item.quantity >= maxQty}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="text-xs text-red-500 hover:text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>

        {item.quantity >= maxQty && (
          <p className="text-xs text-amber-600 mt-1">
            {item.stock < 100
              ? "Max available stock reached."
              : "Maximum quantity reached."}
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        <span className="text-sm font-semibold text-gray-800">
          {formatPrice(subtotal)}
        </span>
      </div>
    </div>
  );
};

export default CartItem;
