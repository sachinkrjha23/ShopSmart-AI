import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import {
  fetchAdminSingleSeller,
  approveSeller,
  rejectSeller,
  suspendSeller,
  clearAdminSingleSeller,
} from '../../store/slices/sellerSlice'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import DetailPageSkeleton from "../../components/ui/DetailPageSkeleton";

const STATUS_VARIANTS = {
  Pending: 'default',
  Approved: 'success',
  Rejected: 'danger',
  Suspended: 'warning',
}

const SellerDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { adminSingleSeller: seller, loading } = useSelector((state) => state.seller)

  const [action, setAction] = useState(null) // 'reject' | 'suspend' | null
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchAdminSingleSeller(id))
    return () => dispatch(clearAdminSingleSeller())
  }, [dispatch, id])

  const handleApprove = async () => {
    try {
      const result = await dispatch(approveSeller(id)).unwrap()
      toast.success(result.message)
    } catch (err) {
      toast.error(err || 'Failed to approve seller')
    }
  }

  const handleConfirmAction = async () => {
    if (!reason.trim()) {
      toast.error('A reason is required.')
      return
    }
    setSubmitting(true)
    try {
      if (action === 'reject') {
        const result = await dispatch(rejectSeller({ id, reason })).unwrap()
        toast.success(result.message)
      } else if (action === 'suspend') {
        const result = await dispatch(suspendSeller({ id, reason })).unwrap()
        toast.success(result.message)
      }
      setAction(null)
      setReason('')
    } catch (err) {
      toast.error(err || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !seller) {
    return <DetailPageSkeleton />
  }

  if (!seller) return null

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/admin/sellers')}
        className="text-sm text-gray-500 hover:text-gray-700 self-start"
      >
        ← Back to Sellers
      </button>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{seller.store_name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {seller.applicant_name} · {seller.applicant_email}
            </p>
          </div>
          <Badge label={seller.status} variant={STATUS_VARIANTS[seller.status]} />
        </div>

        {seller.gstin && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="text-gray-400">GSTIN:</span> {seller.gstin}
          </p>
        )}
        {seller.description && (
          <p className="text-sm text-gray-600 mb-2">{seller.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Applied on{' '}
          {new Date(seller.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>

        {(seller.status === 'Rejected' || seller.status === 'Suspended') && seller.rejection_reason && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-500 font-medium">
              {seller.status === 'Suspended' ? 'Suspension Reason' : 'Rejection Reason'}
            </p>
            <p className="text-sm text-red-700 mt-1">{seller.rejection_reason}</p>
          </div>
        )}

        {seller.resolution_notes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-500 font-medium">Seller's Resolution Notes (on reapply)</p>
            <p className="text-sm text-blue-700 mt-1">{seller.resolution_notes}</p>
          </div>
        )}
      </div>

      {seller.status === 'Pending' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex gap-3">
          <Button onClick={handleApprove} disabled={loading}>
            Approve
          </Button>
          <Button variant="danger" onClick={() => setAction('reject')} disabled={loading}>
            Reject
          </Button>
        </div>
      )}

      {seller.status === 'Approved' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-3">
          <p className="text-sm text-gray-500">
            This seller is currently active. Use this if their account needs to be suspended for a policy
            violation, or removed if approved by mistake.
          </p>
          <Button variant="danger" onClick={() => setAction('suspend')} disabled={loading} className="self-start">
            Suspend
          </Button>
        </div>
      )}

      {action && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-800">
            {action === 'reject' ? 'Reject Application' : 'Suspend Seller'}
          </h2>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Reason for ${action === 'reject' ? 'rejecting' : 'suspending'} (shown to the seller)...`}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleConfirmAction} disabled={submitting}>
              {submitting ? 'Submitting...' : `Confirm ${action === 'reject' ? 'Rejection' : 'Suspension'}`}
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setAction(null); setReason('') }}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerDetail