import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import Button from "../components/ui/Button";
import { checkProductsAvailability } from "../api/productApi";
import { toast } from "react-hot-toast";
import useCart from "../hooks/useCart";

const Cart = () => {
  const { items } = useSelector((state) => state.cart);
  const { removeItem } = useCart();
  const hasValidatedRef = useRef(false);

  useEffect(() => {
    if (hasValidatedRef.current) return;
    if (items.length === 0) return;

    hasValidatedRef.current = true;

    const validateCart = async () => {
      try {
        const res = await checkProductsAvailability(
          items.map((item) => item.productId),
        );
        const unavailable = res.data.unavailable;

        if (unavailable.length > 0) {
          unavailable.forEach((product) => removeItem(product.id));

          const names = unavailable.filter((p) => p.name).map((p) => p.name);
          toast.error(
            names.length > 0
              ? `${names.join(", ")} ${names.length > 1 ? "are" : "is"} no longer available and ${names.length > 1 ? "have" : "has"} been removed from your cart.`
              : "Some items in your cart are no longer available and have been removed.",
          );
        }
      } catch {
      }
    };

    validateCart();
  }, [items, removeItem]);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <h2 className="text-xl font-semibold text-gray-700">
          Your cart is empty
        </h2>
        <p className="text-sm text-gray-500">
          Looks like you haven't added anything yet.
        </p>
        <Link to="/products">
          <Button variant="primary">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>
        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  );
};
export default Cart;