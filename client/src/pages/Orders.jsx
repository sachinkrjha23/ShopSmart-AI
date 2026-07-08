import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyOrders } from '../store/slices/orderSlice'
import OrderCard from '../components/order/OrderCard'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'

const Orders = () => {
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.order)

  useEffect(() => {
    dispatch(fetchMyOrders())
  }, [dispatch])

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Link to="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders