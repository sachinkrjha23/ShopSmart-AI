import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import useCart from '../../hooks/useCart'
import { fetchSettings } from '../../store/slices/settingsSlice'
import CouponInput from './CouponInput'
import Button from '../ui/Button'
import { closeCartDrawer } from '../../store/slices/uiSlice'

const CartSummary = () => {
  const dispatch = useDispatch()
  const { totalQuantity, totalPrice } = useCart()
  const { coupon, discount } = useSelector((state) => state.coupon)
  const { settings } = useSelector((state) => state.settings)

  useEffect(() => {
    dispatch(fetchSettings())
  }, [dispatch])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const shippingFee = settings ? Number(settings.shipping_fee) : 50
  const freeShippingThreshold = settings ? Number(settings.free_shipping_threshold) : 500

  const priceAfterDiscount = totalPrice - discount
  const shipping = priceAfterDiscount > freeShippingThreshold ? 0 : shippingFee
  const estimatedTotal = priceAfterDiscount + shipping

  const isEmpty = totalQuantity === 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Order Summary</h2>

      {!isEmpty && <CouponInput />}

      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Subtotal ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>

      {coupon && discount > 0 && (
        <div className="flex justify-between text-sm text-green-600 mb-2">
          <span>Coupon ({coupon.code})</span>
          <span>-{formatPrice(discount)}</span>
        </div>
      )}

      <div className="flex justify-between text-sm text-gray-600 mb-3">
        <span>Shipping</span>
        <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
      </div>

      <div className="flex justify-between text-base font-semibold text-gray-800 pt-3 border-t border-gray-100">
        <span>Estimated Total</span>
        <span>{formatPrice(estimatedTotal)}</span>
      </div>

      <Link to="/checkout" onClick={() => dispatch(closeCartDrawer())} tabIndex={isEmpty ? -1 : 0}>
        <Button fullWidth disabled={isEmpty} className="mt-4">
          Proceed to Checkout
        </Button>
      </Link>

      {isEmpty && (
        <p className="text-xs text-gray-400 text-center mt-2">Your cart is empty.</p>
      )}
    </div>
  )
}

export default CartSummary