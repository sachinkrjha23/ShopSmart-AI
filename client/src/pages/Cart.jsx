import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import Button from "../components/ui/Button";

const Cart = () => {
  const { items } = useSelector((state) => state.cart);
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