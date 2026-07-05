import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { applyCoupon, removeCoupon } from "../../store/slices/couponSlice";

const CouponInput = () => {
  const dispatch = useDispatch();
  const [code, setCode] = useState("");
  const { totalPrice } = useSelector((state) => state.cart);
  const { coupon, discount, loading, error, appliedForTotal } = useSelector(
    (state) => state.coupon,
  );

  useEffect(() => {
    if (coupon && appliedForTotal !== null && appliedForTotal !== totalPrice) {
      dispatch(removeCoupon());
      toast.error("Your cart changed — please reapply your coupon.");
    }
  }, [totalPrice, coupon, appliedForTotal, dispatch]);

  const handleApply = (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Please enter a coupon code");
    dispatch(applyCoupon({ code: code.trim(), cartTotal: totalPrice }));
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
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
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
