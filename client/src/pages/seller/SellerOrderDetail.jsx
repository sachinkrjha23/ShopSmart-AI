import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchSellerOrderDetail, updateItemFulfillmentStatus, clearSellerOrderDetail, cancelSellerItem } from '../../store/slices/sellerSlice'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import Tooltip from '../../components/ui/Tooltip'

const STATUS_VARIANTS = {
  Pending: 'default',
  Shipped: 'info',
  Delivered: 'success',
  Cancelled: 'danger',
}

// Mirrors the backend's FORWARD_TRANSITIONS in updateFulfillmentStatus —
// keep these two in sync if that ever changes.
const NEXT_STATUS = {
  Pending: 'Shipped',
  Shipped: 'Delivered',
}

const SellerOrderDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { sellerOrderDetail: order, loading, error } = useSelector((state) => state.seller)
  
  // State declarations moved inside the component
  const [cancellingItemId, setCancellingItemId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    dispatch(fetchSellerOrderDetail(id))
    return () => dispatch(clearSellerOrderDetail())
  }, [dispatch, id])

  const handleAdvance = async (item) => {
    const nextStatus = NEXT_STATUS[item.fulfillment_status]
    if (!nextStatus) return
    try {
      await dispatch(updateItemFulfillmentStatus({ itemId: item.id, status: nextStatus })).unwrap()
      toast.success(`Item marked as "${nextStatus}".`)
    } catch (err) {
      toast.error(err || 'Failed to update status')
    }
  }

  const handleConfirmCancel = async (itemId) => {
    if (!cancelReason.trim()) {
      toast.error('A cancellation reason is required.')
      return
    }
    setCancelling(true)
    try {
      const result = await dispatch(cancelSellerItem({ itemId, reason: cancelReason })).unwrap()
      toast.success(result.message)
      setCancellingItemId(null)
      setCancelReason('')
    } catch (err) {
      toast.error(err || 'Failed to cancel item')
    } finally {
      setCancelling(false)
    }
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id)
    toast.success('Order ID copied to clipboard.')
  }

  if (loading && !order) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto text-center py-8">
        <p className="text-gray-500">{error || 'Order not found.'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/seller/orders')}
        className="text-sm text-gray-500 hover:text-gray-700 self-start"
      >
        ← Back to Orders
      </button>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400">Order</p>
            <Tooltip text={order.id}>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors"
              >
                #{order.id.slice(0, 8).toUpperCase()}
              </button>
            </Tooltip>
            <p className="text-xs text-gray-400 mt-1">
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="mt-4 text-right">
          <p className="text-sm font-medium text-gray-800">{order.buyer_name}</p>
          <p className="text-xs text-gray-500">{order.buyer_email}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
        <p className="text-sm text-gray-700">{order.full_name}</p>
        <p className="text-sm text-gray-600">
          {order.address}, {order.city}, {order.state} - {order.pincode}
        </p>
        <p className="text-sm text-gray-500 mt-1">{order.phone}</p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Items</h2>
        {order.items.map((item) => {
          const nextStatus = NEXT_STATUS[item.fulfillment_status]
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-16 w-16 rounded-lg object-cover border border-gray-100"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                  </p>
                  <Badge label={item.fulfillment_status} variant={STATUS_VARIANTS[item.fulfillment_status]} />
                </div>
              </div>

              {/* Show cancellation reason if cancelled */}
              {item.fulfillment_status === 'Cancelled' && item.cancellation_reason && (
                <p className="text-sm text-gray-500 mb-3">
                  Cancelled — {item.cancellation_reason}
                  {item.refund_amount && ` · ₹${Number(item.refund_amount).toLocaleString('en-IN')} refunded`}
                </p>
              )}

              {/* Action buttons based on status */}
              {cancellingItemId === item.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancelling (shown to the buyer)..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <Button variant="danger" onClick={() => handleConfirmCancel(item.id)} disabled={cancelling}>
                      {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setCancellingItemId(null); setCancelReason('') }} disabled={cancelling}>
                      Nevermind
                    </Button>
                  </div>
                </div>
              ) : item.fulfillment_status === 'Pending' || item.fulfillment_status === 'Shipped' ? (
                <div className="flex gap-3">
                  {nextStatus && (
                    <Button onClick={() => handleAdvance(item)} disabled={loading}>
                      Mark as {nextStatus}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setCancellingItemId(item.id)}>
                    Cancel Item
                  </Button>
                </div>
              ) : item.fulfillment_status === 'Delivered' ? (
                <p className="text-sm text-gray-500">This item has been delivered.</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SellerOrderDetail