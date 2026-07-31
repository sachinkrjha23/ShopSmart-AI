import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { addAddress, editAddress } from '../../store/slices/addressSlice'
import Input from '../ui/Input'
import Button from '../ui/Button'

const AddressForm = ({ addressId = null, initialData = null, onSuccess, onCancel }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.address)

  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || 'India',
    pincode: initialData?.pincode || '',
    is_default: initialData?.is_default || false,
  })

  const isEditMode = Boolean(addressId)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!formData.full_name || !formData.phone || !formData.address ||
        !formData.city || !formData.state || !formData.country || !formData.pincode) {
      toast.error('Please fill in all required fields')
      return false
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error('Please provide a valid 10-digit Indian phone number')
      return false
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error('Please provide a valid 6-digit pincode')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      if (isEditMode) {
        await dispatch(editAddress({ id: addressId, data: formData })).unwrap()
        toast.success('Address updated successfully!')
      } else {
        await dispatch(addAddress(formData)).unwrap()
        toast.success('Address added successfully!')
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label="Full Name"
        name="full_name"
        value={formData.full_name}
        onChange={handleChange}
        placeholder="Full name"
        required
      />
      <Input
        label="Phone"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="10-digit mobile number"
        required
      />
      <Input
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="House no., street, area"
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="City"
          required
        />
        <Input
          label="State"
          name="state"
          value={formData.state}
          onChange={handleChange}
          placeholder="State"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Pincode"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          placeholder="6-digit pincode"
          required
        />
        <Input
          label="Country"
          name="country"
          value={formData.country}
          onChange={handleChange}
          placeholder="Country"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 mt-1">
        <input
          type="checkbox"
          name="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData((prev) => ({ ...prev, is_default: e.target.checked }))}
          className="rounded border-gray-300"
        />
        Set as default address
      </label>

      <div className="flex gap-3 mt-2">
        <Button type="submit" disabled={loading} fullWidth>
          {loading ? 'Saving...' : isEditMode ? 'Update Address' : 'Save Address'}
        </Button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default AddressForm