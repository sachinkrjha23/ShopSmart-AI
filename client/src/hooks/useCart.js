import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  clearCartLimitError,
} from "../store/slices/cartSlice";
import { openLoginModal } from "../store/slices/uiSlice";

const useCart = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items, totalQuantity, totalPrice, limitError } = useSelector(
    (state) => state.cart,
  );

  const addItem = (product, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to your cart.");
      dispatch(openLoginModal());
      return;
    }

    const cap = Math.min(product.stock ?? 100, 100);
    const existing = items.find((i) => i.productId === product.id);
    const currentQty = existing?.quantity || 0;

    if (currentQty >= cap) {
      toast.error(
        `You already have the maximum available quantity (${cap}) of this product in your cart.`,
      );
      return;
    }

    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        image: product.images?.[0]?.url || "",
        price: Number(product.price),
        stock: product.stock,
        quantity,
      }),
    );

    const wouldBe = currentQty + quantity;
    if (wouldBe > cap) {
      toast.success(`Added to cart! (Limited to available stock: ${cap})`);
    } else {
      toast.success("Added to cart!");
    }
  };

  const removeItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const changeQuantity = (productId, quantity) => {
    dispatch(updateQuantity({ productId, quantity }));
  };

  const decreaseQuantity = (productId) => {
    const existing = items.find((i) => i.productId === productId);
    if (!existing) return;

    if (existing.quantity <= 1) {
      dispatch(removeFromCart(productId));
    } else {
      dispatch(updateQuantity({ productId, quantity: existing.quantity - 1 }));
    }
  };

  const emptyCart = () => {
    dispatch(clearCart());
  };

  const isInCart = (productId) => items.some((i) => i.productId === productId);

  const getItemQuantity = (productId) =>
    items.find((i) => i.productId === productId)?.quantity || 0;

  if (limitError) {
    toast.error(limitError);
    dispatch(clearCartLimitError());
  }

  return {
    items,
    totalQuantity,
    totalPrice,
    addItem,
    removeItem,
    changeQuantity,
    decreaseQuantity,
    emptyCart,
    isInCart,
    getItemQuantity,
  };
};

export default useCart;
