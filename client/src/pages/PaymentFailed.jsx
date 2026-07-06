import { useLocation, Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const PaymentFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Payment Failed</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Something went wrong while processing your payment. Your cart items are
        still saved — you can try again.
      </p>
      {orderId && <p className="text-xs text-gray-400">Reference: {orderId}</p>}
      <div className="flex gap-3 mt-2">
        <Link to="/cart">
          <Button variant="secondary">Back to Cart</Button>
        </Link>
        <Button variant="primary" onClick={() => navigate("/checkout")}>
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default PaymentFailed;
