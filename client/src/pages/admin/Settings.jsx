import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchSettings, updateSettings } from '../../store/slices/settingsSlice'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'

const EMPTY_FORM = {
  shipping_fee: '',
  free_shipping_threshold: '',
  tax_rate: '',
  low_stock_threshold: '',
}

const AdminSettings = () => {
  const dispatch = useDispatch()
  const { settings, loading } = useSelector((state) => state.settings)
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    dispatch(fetchSettings())
  }, [dispatch])

  useEffect(() => {
    if (settings) {
      setFormData({
        shipping_fee: settings.shipping_fee,
        free_shipping_threshold: settings.free_shipping_threshold,
        tax_rate: settings.tax_rate,
        low_stock_threshold: settings.low_stock_threshold,
      })
    }
  }, [settings])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await dispatch(
        updateSettings({
          shipping_fee: parseFloat(formData.shipping_fee),
          free_shipping_threshold: parseFloat(formData.free_shipping_threshold),
          tax_rate: parseFloat(formData.tax_rate),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
        }),
      ).unwrap()
      toast.success('Store settings updated successfully.')
    } catch (err) {
      toast.error(err || 'Failed to update settings')
    }
  }

  if (loading && !settings) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Store Configuration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Controls checkout pricing for every customer — changes take effect on the next order placed.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shipping Fee (₹)"
              name="shipping_fee"
              type="number"
              min="0"
              step="0.01"
              value={formData.shipping_fee}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <Input
              label="Free Shipping Above (₹)"
              name="free_shipping_threshold"
              type="number"
              min="0"
              step="0.01"
              value={formData.free_shipping_threshold}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tax Rate (%)"
              name="tax_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.tax_rate}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <Input
              label="Low Stock Alert Threshold"
              name="low_stock_threshold"
              type="number"
              min="0"
              value={formData.low_stock_threshold}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="self-start">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Admin Account & Security</h2>
        <p className="text-sm text-gray-500 mb-4">
          Manage your name, email, password, and admin security secret from your account page.
        </p>
        <Link to="/profile">
          <Button variant="outline">Go to Account Settings</Button>
        </Link>
      </div>
    </div>
  )
}

export default AdminSettings