import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import AddressSelector from '../components/checkout/AddressSelector'
import OrderSummary from '../components/checkout/OrderSummary'
import RazorpayButton from '../components/checkout/RazorpayButton'
import { checkProductsAvailability } from '../api/productApi'
import useCart from '../hooks/useCart'

const Checkout = () => {
  const navigate = useNavigate()
  const { items } = useSelector((state) => state.cart)
  const { removeItem } = useCart()
  const hasCheckedRef = useRef(false)
  const hasValidatedRef = useRef(false)

  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true
      if (items.length === 0) {
        navigate('/cart', { replace: true })
      }
    }
  }, [])

  useEffect(() => {
    if (hasValidatedRef.current) return
    if (items.length === 0) return

    hasValidatedRef.current = true

    const validateCart = async () => {
      try {
        const res = await checkProductsAvailability(items.map((item) => item.productId))
        const unavailable = res.data.unavailable

        if (unavailable.length > 0) {
          const unavailableIds = new Set(unavailable.map((p) => p.id))
          unavailable.forEach((product) => removeItem(product.id))

          const names = unavailable.filter((p) => p.name).map((p) => p.name)
          toast.error(
            names.length > 0
              ? `${names.join(', ')} ${names.length > 1 ? 'are' : 'is'} no longer available and ${names.length > 1 ? 'have' : 'has'} been removed from your cart.`
              : 'Some items in your cart are no longer available and have been removed.',
          )

          // The items removed here might have been the ENTIRE cart — if so,
          // there's nothing left to check out, so send the user back to
          // /cart instead of leaving them stranded on an empty checkout page.
          const remainingCount = items.filter((item) => !unavailableIds.has(item.productId)).length
          if (remainingCount === 0) {
            navigate('/cart', { replace: true })
          }
        }
      } catch {
        // Fail silently — worst case, the createOrder-level check still catches it later
      }
    }

    validateCart()
  }, [items, removeItem, navigate])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AddressSelector />
        </div>
        <div className="flex flex-col gap-4">
          <OrderSummary />
          <RazorpayButton />
        </div>
      </div>
    </div>
  )
}

export default Checkout