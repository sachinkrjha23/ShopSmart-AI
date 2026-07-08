import Badge from '../ui/Badge'

const STATUS_VARIANTS = {
  Processing: 'info',
  Shipped: 'warning',
  Delivered: 'success',
  Cancelled: 'danger',
}

const OrderStatusBadge = ({ status }) => {
  const variant = STATUS_VARIANTS[status] || 'default'
  return <Badge label={status} variant={variant} />
}

export default OrderStatusBadge