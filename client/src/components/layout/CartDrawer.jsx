import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { closeCartDrawer } from "../../store/slices/uiSlice";
import CartItem from "../cart/CartItem";
import CartSummary from "../cart/CartSummary";
import Button from "../ui/Button";

const CartDrawer = () => {
  const dispatch = useDispatch();
  const { isCartDrawerOpen } = useSelector((state) => state.ui);
  const { items } = useSelector((state) => state.cart);

  if (!isCartDrawerOpen) return null;

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => dispatch(closeCartDrawer())}
      />
      <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Your Cart {itemCount > 0 && `(${itemCount})`}
          </h2>
          <button
            onClick={() => dispatch(closeCartDrawer())}
            className="flex items-center justify-center h-11 w-11 -mr-2 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-10">
              <p className="text-gray-500 text-sm">Your cart is empty.</p>
              <Link to="/products" onClick={() => dispatch(closeCartDrawer())}>
                <Button variant="primary" size="sm">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            items.map((item) => <CartItem key={item.productId} item={item} />)
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <CartSummary />
            <Link to="/cart" onClick={() => dispatch(closeCartDrawer())}>
              <button className="w-full text-center text-sm text-teal-600 hover:underline mt-3">
                View Full Cart
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
