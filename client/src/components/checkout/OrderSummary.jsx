import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettings } from "../../store/slices/settingsSlice";

const OrderSummary = () => {
  const dispatch = useDispatch();
  const { items, totalQuantity, totalPrice } = useSelector(
    (state) => state.cart,
  );
  const { coupon, discount } = useSelector((state) => state.coupon);
  const { selectedAddress } = useSelector((state) => state.address);
  const { settings } = useSelector((state) => state.settings);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const shippingFee = settings ? Number(settings.shipping_fee) : 50;
  const freeShippingThreshold = settings
    ? Number(settings.free_shipping_threshold)
    : 500;

  const priceAfterDiscount = totalPrice - discount;
  const shipping = priceAfterDiscount > freeShippingThreshold ? 0 : shippingFee;
  const estimatedTotal = priceAfterDiscount + shipping;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Review Order
      </h2>

      <div className="flex flex-col gap-3 max-h-64 overflow-y-auto mb-4">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3 text-sm">
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-12 rounded-lg object-cover bg-gray-100"
            />
            <div className="flex-1">
              <p className="text-gray-800 line-clamp-1">{item.name}</p>
              <p className="text-gray-500">Qty: {item.quantity}</p>
            </div>
            <span className="text-gray-800 font-medium">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {selectedAddress && (
        <div className="text-sm text-gray-600 border-t border-gray-100 pt-3 mb-3">
          <p className="font-medium text-gray-800">Deliver to:</p>
          <p>
            {selectedAddress.full_name}, {selectedAddress.address},{" "}
            {selectedAddress.city} - {selectedAddress.pincode}
          </p>
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({totalQuantity} items)</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        {coupon && discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Coupon ({coupon.code})</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-gray-800 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>{formatPrice(estimatedTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
