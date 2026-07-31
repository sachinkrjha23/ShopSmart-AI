import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchSellerOrders } from '../../store/slices/sellerSlice'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import TableSkeleton from '../../components/ui/TableSkeleton'
import Tooltip from '../../components/ui/Tooltip'

const STATUS_VARIANTS = {
  Pending: 'default',
  Shipped: 'info',
  Delivered: 'success',
}

const SellerOrders = () => {
  const dispatch = useDispatch()
  const { sellerOrders, sellerOrdersPagination, loading } = useSelector((state) => state.seller)

  useEffect(() => {
    dispatch(fetchSellerOrders({ page: 1 }))
  }, [dispatch])

  const handlePageChange = (page) => {
    dispatch(fetchSellerOrders({ page }))
  }

  const handleCopyId = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    toast.success('Order ID copied to clipboard.')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {loading && sellerOrders.length === 0 ? (
        <TableSkeleton columns={5} />
      ) : sellerOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No orders yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Your Subtotal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {sellerOrders.map((order) => (
                <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/seller/orders/${order.id}`} className="font-medium text-teal-600 hover:underline">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <Tooltip text={order.id}>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(e, order.id)}
                          className="text-gray-300 hover:text-teal-600 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{order.buyer_name}</td>
                  <td className="px-4 py-3 text-gray-600">{order.item_count}</td>
                  <td className="px-4 py-3 text-gray-800">
                    ₹{Number(order.seller_subtotal).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {order.fulfillment_statuses.map((status) => (
                        <Badge key={status} label={status} variant={STATUS_VARIANTS[status]} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={sellerOrdersPagination.currentPage}
        totalPages={sellerOrdersPagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default SellerOrders