import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-hot-toast'
import { createOrder } from '../../store/slices/orderSlice'
import useRazorpay from '../../hooks/useRazorpay'
import Button from '../ui/Button'

const RazorpayButton = () => {
  const dispatch = useDispatch()
  const { initiatePayment, loading: paymentLoading } = useRazorpay()
  const { items } = useSelector((state) => state.cart)
  const { selectedAddress } = useSelector((state) => state.address)
  const { coupon } = useSelector((state) => state.coupon)
  const { loading: orderLoading } = useSelector((state) => state.order)

  const isLoading = orderLoading || paymentLoading

  const handlePayment = async () => {
    if (items.length === 0) {
      return toast.error('Your cart is empty.')
    }
    if (!selectedAddress) {
      return toast.error('Please select a delivery address.')
    }

    const cartItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      image: item.image,
      title: item.name,
    }))

    try {
      const response = await dispatch(
        createOrder({
          cartItems,
          addressId: selectedAddress.id,
          coupon_code: coupon?.code || undefined,
        }),
      ).unwrap()

      await initiatePayment({
        orderId: response.orderId,
        razorpayOrderId: response.razorpayOrderId,
        amount: response.amount, 
        currency: response.currency,
        keyId: response.keyId,
      })
    } catch (err) {
      toast.error(err || 'Failed to start payment.')
    }
  }

  return (
    <Button
      fullWidth
      onClick={handlePayment}
      disabled={isLoading || items.length === 0}
    >
      {isLoading ? 'Processing...' : 'Proceed to Payment'}
    </Button>
  )
}

export default RazorpayButton