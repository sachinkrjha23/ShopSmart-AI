import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  applyCoupon,
  removeCoupon,
  clearPendingCode,
} from "../../store/slices/couponSlice";

const CouponInput = () => {
  const dispatch = useDispatch();
  const [code, setCode] = useState("");
  const { totalPrice, items } = useSelector((state) => state.cart);
  const { coupon, discount, loading, error, appliedForTotal, pendingCode, eligibleAmount } =
    useSelector((state) => state.coupon);

  const buildCartItems = () =>
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

  useEffect(() => {
    if (pendingCode && !coupon && totalPrice > 0) {
      dispatch(applyCoupon({ code: pendingCode, cartItems: buildCartItems() }))
        .unwrap()
        .catch(() => {})
        .finally(() => dispatch(clearPendingCode()));
    }
  }, [pendingCode, totalPrice]);

  useEffect(() => {
    if (coupon && appliedForTotal !== null && appliedForTotal !== totalPrice) {
      dispatch(removeCoupon());
      toast.error("Your cart changed — please reapply your coupon.");
    }
  }, [totalPrice, coupon, appliedForTotal, dispatch]);

  const handleApply = (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Please enter a coupon code");
    dispatch(applyCoupon({ code: code.trim(), cartItems: buildCartItems() }));
  };

  const handleRemove = () => {
    dispatch(removeCoupon());
    setCode("");
  };

  useEffect(() => {
    if (coupon) toast.success(`Coupon "${coupon.code}" applied!`);
  }, [coupon]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (coupon) {
    return (
      <div className="flex flex-col gap-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-green-700">{coupon.code}</span>
            <span className="text-green-600 ml-2">
              {coupon.type === "percentage"
                ? `Up to ${coupon.discountValue}% off applied`
                : `₹${coupon.discountValue} off applied`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
        {coupon.sellerScoped && eligibleAmount < totalPrice && (
          <p className="text-xs text-green-600">
            Applies only to items from{" "}
            <span className="font-medium">{coupon.sellerName || "this seller"}</span>
            {" "}— not your full cart.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="flex gap-2 mb-3">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter coupon code"
        disabled={loading}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 uppercase placeholder:normal-case"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Checking..." : "Apply"}
      </button>
    </form>
  );
};

export default CouponInput;