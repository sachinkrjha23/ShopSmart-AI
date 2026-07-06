import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSingleOrder, clearSingleOrder } from '../store/slices/orderSlice'
import Loader from '../components/ui/Loader'
import Button from '../components/ui/Button'

const PaymentSuccess = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const orderId = location.state?.orderId
  const { singleOrder: order, loading } = useSelector((state) => state.order)

  useEffect(() => {
    if (orderId) {
      dispatch(fetchSingleOrder(orderId))
    }
    return () => dispatch(clearSingleOrder())
  }, [orderId, dispatch])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Refreshing this page loses location.state (React Router state doesn't
  // survive a hard reload) — still show a genuine success message rather
  // than an error, since the payment DID succeed; just without order details.
  if (!orderId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Payment Successful!</h2>
        <p className="text-sm text-gray-500">Your order has been placed.</p>
        <Link to="/">
          <Button variant="primary">Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  if (loading) return <Loader fullScreen />

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
        <p className="text-sm text-gray-500">
          Thank you for your order. A confirmation has been sent to your account.
        </p>
      </div>

      {order && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">Order ID</span>
            <span className="text-sm font-medium text-gray-800">{order.id}</span>
          </div>

          <div className="flex flex-col gap-3 mb-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex gap-3 text-sm">
                <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                <div className="flex-1">
                  <p className="text-gray-800 line-clamp-1">{item.title}</p>
                  <p className="text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="text-gray-800 font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between text-base font-semibold text-gray-800">
            <span>Total Paid</span>
            <span>{formatPrice(order.total_price)}</span>
          </div>

          {order.full_name && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
              <p className="font-medium text-gray-800 mb-1">Delivering to:</p>
              <p>{order.full_name}, {order.address}, {order.city} - {order.pincode}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6 justify-center">
        <Link to="/">
          <Button variant="secondary">Continue Shopping</Button>
        </Link>
        
        <Link to="/orders">
          <Button variant="primary">View My Orders</Button>
        </Link>
      </div>
    </div>
  )
}

export default PaymentSuccess