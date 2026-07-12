import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchSingleOrder,
  cancelOrder,
  clearSingleOrder,
} from "../store/slices/orderSlice";
import OrderStatusBadge from "../components/order/OrderStatusBadge";
import OrderTimeline from "../components/order/OrderTimeline";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";
import { downloadInvoice } from "../api/orderApi";

const PAYMENT_TAGS = {
  Pending: {
    label: "Payment Pending",
    className: "bg-yellow-50 text-yellow-700",
  },
  Failed: { label: "Payment Failed", className: "bg-red-50 text-red-700" },
  Refunded: { label: "Refunded", className: "bg-blue-50 text-blue-700" },
};

const OrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    singleOrder: order,
    loading,
    error,
  } = useSelector((state) => state.order);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSingleOrder(id));
    return () => dispatch(clearSingleOrder());
  }, [dispatch, id]);

  const handleCancelConfirm = async () => {
    setCancelDialogOpen(false);
    try {
      await dispatch(cancelOrder(id)).unwrap();
      toast.success("Order cancelled successfully.");
    } catch (err) {
      toast.error(err || "Failed to cancel order");
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download invoice");
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 mb-4">{error || "Order not found."}</p>
        <Link to="/orders">
          <Button>Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  const items = (order.items || []).filter(Boolean);
  const paymentTag = PAYMENT_TAGS[order.payment_status];
  const canCancel = order.order_status === "Processing";
  const subtotal =
    Number(order.total_price) +
    Number(order.discount_amount || 0) -
    Number(order.shipping_price);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate("/orders")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← Back to My Orders
      </button>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-xs text-gray-400">Order ID</p>
            <p className="text-sm font-medium text-gray-800">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OrderStatusBadge status={order.order_status} />
            {paymentTag && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentTag.className}`}
              >
                {paymentTag.label}
              </span>
            )}
          </div>
        </div>

        <OrderTimeline status={order.order_status} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div
              key={`${item.productId}-${index}`}
              className="flex items-center gap-4"
            >
              <img
                src={item.image}
                alt={item.title}
                className="h-16 w-16 rounded-lg object-cover border border-gray-100"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Shipping Address
        </h2>
        <p className="text-sm text-gray-700">{order.full_name}</p>
        <p className="text-sm text-gray-600">
          {order.address}, {order.city}, {order.state} - {order.pincode}
        </p>
        <p className="text-sm text-gray-500 mt-1">{order.phone}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Order Summary
        </h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>
                Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
              </span>
              <span>
                -₹{Number(order.discount_amount).toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>
              {Number(order.shipping_price) > 0
                ? `₹${order.shipping_price}`
                : "Free"}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>₹{Number(order.total_price).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {canCancel && (
          <div className="mt-6">
            <Button
              variant="danger"
              onClick={() => setCancelDialogOpen(true)}
              disabled={loading}
            >
              Cancel Order
            </Button>
          </div>
        )}

        {order.payment_status === "Paid" && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={handleDownloadInvoice}
              disabled={loading}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Invoice
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This cannot be undone."
        confirmLabel="Cancel Order"
        variant="danger"
      />
    </div>
  );
};

export default OrderDetail;
