import { Link } from 'react-router-dom'
import OrderStatusBadge from './OrderStatusBadge'

const OrderCard = ({ order }) => {
  const items = (order.items || []).filter(Boolean)
  const previewItems = items.slice(0, 4)

  return (
    <Link
      to={`/orders/${order.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400">Order ID</p>
          <p className="text-sm font-medium text-gray-800">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <OrderStatusBadge status={order.order_status} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        {previewItems.map((item, index) => (
          <img
            key={`${item.productId}-${index}`}
            src={item.image}
            alt={item.title}
            className="h-12 w-12 rounded-lg object-cover border border-gray-100"
          />
        ))}
        {items.length > 4 && (
          <span className="text-xs text-gray-500">+{items.length - 4} more</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <span className="font-semibold text-gray-900">
          ₹{Number(order.total_price).toLocaleString('en-IN')}
        </span>
      </div>
    </Link>
  )
}

export default OrderCard