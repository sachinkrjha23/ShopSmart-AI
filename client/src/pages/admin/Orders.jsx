import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAdminOrders, setAdminOrderFilters } from '../../store/slices/orderSlice'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/ui/Pagination'
import TableSkeleton from '../../components/ui/TableSkeleton'


const STATUS_OPTIONS = ['Processing', 'Shipped', 'Delivered', 'Cancelled']

const AdminOrders = () => {
  const dispatch = useDispatch()
  const { adminOrders, adminPagination, adminFilters, loading } = useSelector((state) => state.order)
  const [search, setSearch] = useState(adminFilters.search)

  useEffect(() => {
    dispatch(fetchAdminOrders({ page: 1, status: adminFilters.status, search: adminFilters.search }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(setAdminOrderFilters({ search }))
    dispatch(fetchAdminOrders({ page: 1, status: adminFilters.status, search }))
  }

  const handleStatusChange = (e) => {
    const status = e.target.value
    dispatch(setAdminOrderFilters({ status }))
    dispatch(fetchAdminOrders({ page: 1, status, search: adminFilters.search }))
  }

  const handlePageChange = (page) => {
    dispatch(fetchAdminOrders({ page, status: adminFilters.status, search: adminFilters.search }))
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex gap-3 max-w-md flex-1 min-w-[240px]">
          <Input
            placeholder="Search by order ID, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>

        <select
          value={adminFilters.status}
          onChange={handleStatusChange}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {loading && adminOrders.length === 0 ? (
        <TableSkeleton columns={6} />
      ) : adminOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminOrders.map((order) => (
                <tr key={order.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800">{order.buyer_name || '—'}</p>
                    <p className="text-xs text-gray-500">{order.buyer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.order_status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.payment_status || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    ₹{Number(order.total_price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-teal-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={adminPagination.currentPage}
        totalPages={adminPagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default AdminOrders