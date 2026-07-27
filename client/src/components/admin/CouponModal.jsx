import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { createAdminCoupon, updateAdminCoupon } from '../../store/slices/couponSlice'

const toDateTimeLocal = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60000)
  return localDate.toISOString().slice(0, 16)
}

const EMPTY_FORM = {
  code: '',
  type: 'percentage',
  discount_value: '',
  min_order_amount: '',
  max_discount: '',
  usage_limit: '',
  per_user_limit: '1',
  valid_from: '',
  valid_until: '',
}

const CouponModal = ({ isOpen, onClose, coupon, onSaved }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.coupon)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const isEditing = Boolean(coupon)

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code || '',
        type: coupon.type || 'percentage',
        discount_value: coupon.discount_value ?? '',
        min_order_amount: coupon.min_order_amount ?? '',
        max_discount: coupon.max_discount ?? '',
        usage_limit: coupon.usage_limit ?? '',
        per_user_limit: coupon.per_user_limit ?? '1',
        valid_from: toDateTimeLocal(coupon.valid_from),
        valid_until: toDateTimeLocal(coupon.valid_until),
      })
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [coupon, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }))
  }

  const validate = () => {
    const { code, type, discount_value, valid_from, valid_until } = formData
    if (!code.trim() || !type || !discount_value || !valid_from || !valid_until) {
      toast.error('Please fill in all required fields')
      return false
    }
    if (type === 'percentage' && parseFloat(discount_value) > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return false
    }
    if (new Date(valid_from) >= new Date(valid_until)) {
      toast.error('End date must be after start date')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      code: formData.code.trim(),
      type: formData.type,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      per_user_limit: formData.per_user_limit ? parseInt(formData.per_user_limit) : 1,
      valid_from: new Date(formData.valid_from).toISOString(),
      valid_until: new Date(formData.valid_until).toISOString(),
    }

    try {
      if (isEditing) {
        await dispatch(updateAdminCoupon({ id: coupon.id, data: payload })).unwrap()
        toast.success('Coupon updated successfully!')
      } else {
        await dispatch(createAdminCoupon(payload)).unwrap()
        toast.success('Coupon created successfully!')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err || 'Failed to save coupon')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Coupon' : 'Create Coupon'} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Coupon Code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="e.g. FLAT500"
          disabled={loading}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 bg-white"
            >
              <option value="percentage">Percentage</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>
          <Input
            label={formData.type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
            name="discount_value"
            type="number"
            value={formData.discount_value}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Order Amount (₹)"
            name="min_order_amount"
            type="number"
            value={formData.min_order_amount}
            onChange={handleChange}
            disabled={loading}
            placeholder="0"
          />
          <Input
            label="Max Discount Cap (₹)"
            name="max_discount"
            type="number"
            value={formData.max_discount}
            onChange={handleChange}
            disabled={loading}
            placeholder="No cap"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Usage Limit (total)"
            name="usage_limit"
            type="number"
            value={formData.usage_limit}
            onChange={handleChange}
            disabled={loading}
            placeholder="Unlimited"
          />
          <Input
            label="Per-User Limit"
            name="per_user_limit"
            type="number"
            value={formData.per_user_limit}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valid From"
            name="valid_from"
            type="datetime-local"
            value={formData.valid_from}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <Input
            label="Valid Until"
            name="valid_until"
            type="datetime-local"
            value={formData.valid_until}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Coupon'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CouponModal