import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchMySellerProfile, applyForSeller } from '../store/slices/sellerSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'

const BecomeSeller = () => {
  const dispatch = useDispatch()
  const { mySeller, mySellerChecked, loading, error } = useSelector((state) => state.seller)

  const [formData, setFormData] = useState({
    store_name: '',
    gstin: '',
    description: '',
    resolution_notes: '',
  })

  useEffect(() => {
    if (!mySellerChecked) {
      dispatch(fetchMySellerProfile())
    }
  }, [dispatch, mySellerChecked])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await dispatch(applyForSeller(formData)).unwrap()
      toast.success(result.message)
    } catch (err) {
      toast.error(err || 'Failed to submit application')
    }
  }

  if (!mySellerChecked) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  // Approved — nothing to do here, send them to their dashboard
  if (mySeller?.status === 'Approved') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're already a seller!</h1>
        <p className="text-gray-500 mb-6">Your store "{mySeller.store_name}" is live.</p>
        <Link to="/seller">
          <Button>Go to Seller Dashboard</Button>
        </Link>
      </div>
    )
  }

  // Pending — just show status, no form
  if (mySeller?.status === 'Pending') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h1>
        <p className="text-gray-500">
          Your application for "{mySeller.store_name}" is pending review. We'll notify you by email once a decision is made.
        </p>
      </div>
    )
  }

  // Rejected — show reason, cooldown handled server-side (error message will show it if too early)
  if (mySeller?.status === 'Rejected') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Application Not Approved</h1>
        <p className="text-gray-600 text-center mb-2">
          Your previous application for "{mySeller.store_name}" was not approved.
        </p>
        <p className="text-sm text-gray-500 text-center mb-8">
          <strong>Reason:</strong> {mySeller.rejection_reason}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800">Reapply</h2>
          <Input
            label="Store Name"
            name="store_name"
            value={formData.store_name || mySeller.store_name}
            onChange={handleChange}
            required
          />
          <Input
            label="GSTIN (optional)"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            placeholder="15-character GSTIN"
          />
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Resubmit Application'}
          </Button>
        </form>
      </div>
    )
  }

  // Suspended — show reason + require resolution notes to reapply
  if (mySeller?.status === 'Suspended') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Seller Account Suspended</h1>
        <p className="text-gray-600 text-center mb-2">
          Your seller account "{mySeller.store_name}" was suspended.
        </p>
        <p className="text-sm text-gray-500 text-center mb-8">
          <strong>Reason:</strong> {mySeller.rejection_reason}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800">Reapply</h2>
          <Input
            label="Store Name"
            name="store_name"
            value={formData.store_name || mySeller.store_name}
            onChange={handleChange}
            required
          />
          <Input
            label="GSTIN (optional)"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
          />
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          <Input
            label="What have you changed to resolve this issue?"
            name="resolution_notes"
            value={formData.resolution_notes}
            onChange={handleChange}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Resubmit Application'}
          </Button>
        </form>
      </div>
    )
  }

  // Not applied yet — default: show the apply form
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Sell on ShopSmart AI</h1>
      <p className="text-gray-500 text-center mb-8">
        Apply to become a seller and start listing your own products.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-xl border border-gray-100 p-6">
        <Input
          label="Store Name"
          name="store_name"
          value={formData.store_name}
          onChange={handleChange}
          required
        />
        <Input
          label="GSTIN (optional)"
          name="gstin"
          value={formData.gstin}
          onChange={handleChange}
          placeholder="15-character GSTIN"
        />
        <Input
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </div>
  )
}

export default BecomeSeller