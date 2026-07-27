import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { submitReport } from '../../store/slices/reportSlice'

const REASONS = {
  product: ['Counterfeit or fake product', 'Misleading description', 'Prohibited or illegal item', 'Inappropriate content', 'Other'],
  review: ['Spam', 'Offensive or abusive language', 'Fake review', 'Not relevant to this product', 'Other'],
  seller: ['Fraud or scam', 'Poor or unprofessional conduct', 'Selling counterfeit products', 'Other'],
}

const ReportButton = ({ entityType, entityId, label = 'Report' }) => {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { submitting } = useSelector((state) => state.report)
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  if (!isAuthenticated) return null

  const reset = () => {
    setReason('')
    setDescription('')
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  const handleSubmit = async () => {
    if (!reason) return toast.error('Please select a reason')

    const result = await dispatch(
      submitReport({ entityType, entityId, reason, description }),
    )

    if (submitReport.fulfilled.match(result)) {
      toast.success('Report submitted. Our team will review it shortly.')
      handleClose()
    } else {
      toast.error(result.payload || 'Failed to submit report')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-gray-400 hover:text-red-500 underline-offset-2 hover:underline"
      >
        {label}
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title={`Report ${entityType}`} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Select a reason</option>
              {REASONS[entityType].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 resize-none"
              placeholder="Anything that would help our team review this"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ReportButton