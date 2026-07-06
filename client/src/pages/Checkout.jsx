import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AddressSelector from '../components/checkout/AddressSelector'
import OrderSummary from '../components/checkout/OrderSummary'
import RazorpayButton from '../components/checkout/RazorpayButton'

const Checkout = () => {
  const navigate = useNavigate()
  const { items } = useSelector((state) => state.cart)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true
      if (items.length === 0) {
        navigate('/cart', { replace: true })
      }
    }
  }, [])

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