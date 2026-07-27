import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { verifyPayment as verifyPaymentApi } from '../api/orderApi'
import { clearCart } from '../store/slices/cartSlice'
import { removeCoupon } from '../store/slices/couponSlice'

let razorpayScriptPromise = null

const loadRazorpayScript = () => {
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

const useRazorpay = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const initiatePayment = useCallback(
    async ({ orderId, razorpayOrderId, amount, currency, keyId }) => {
      setLoading(true)

      try {
        const Razorpay = await loadRazorpayScript()

        const options = {
          key: keyId,
          amount: amount, // paise, exactly as returned by createOrder
          currency: currency || 'INR',
          name: 'ShopSmart AI',
          description: 'Order Payment',
          order_id: razorpayOrderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          handler: async (response) => {
            try {
              await verifyPaymentApi({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              })

              dispatch(clearCart())
              dispatch(removeCoupon())
              toast.success('Payment successful! Order confirmed.')
              navigate('/payment-success', { state: { orderId } })
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed.')
              navigate('/payment-failed', { state: { orderId } })
            } finally {
              setLoading(false)
            }
          },
          modal: {
            ondismiss: () => {
              // User closed the popup without paying — not an error, just
              // a cancelled attempt. Order stays in 'Processing' status,
              // cart is NOT cleared, so they can retry from Checkout.
              setLoading(false)
              toast('Payment cancelled.', { icon: 'ℹ️' })
            },
          },
          theme: {
            color: '#4f46e5', // matches your teal-600 accent
          },
        }

        const razorpayInstance = new Razorpay(options)

        razorpayInstance.on('payment.failed', (response) => {
          setLoading(false)
          toast.error(response.error?.description || 'Payment failed.')
        })

        razorpayInstance.open()
      } catch (err) {
        setLoading(false)
        toast.error('Could not load payment gateway. Please try again.')
      }
    },
    [dispatch, navigate, user],
  )

  return { initiatePayment, loading }
}

export default useRazorpay