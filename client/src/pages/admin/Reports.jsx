import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAdminReports, resolveReportThunk } from '../../store/slices/reportSlice'
import TableSkeleton from '../../components/ui/TableSkeleton'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'

const STATUS_VARIANTS = {
  Pending: 'warning',
  Resolved: 'success',
  Dismissed: 'default',
}

const ENTITY_TYPES = ['product', 'review', 'seller']

const Reports = () => {
  const dispatch = useDispatch()
  const { adminReports, totalReports, currentPage, loading } = useSelector((state) => state.report)
  const [filters, setFilters] = useState({ status: '', entityType: '' })
  const [resolveTarget, setResolveTarget] = useState(null) // { id, status }
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalReports / 15))

  const load = (page = 1) => {
    const params = { page }
    if (filters.status) params.status = filters.status
    if (filters.entityType) params.entityType = filters.entityType
    dispatch(fetchAdminReports(params))
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const applyFilters = () => load(1)

  const clearFilters = () => {
    setFilters({ status: '', entityType: '' })
    dispatch(fetchAdminReports({ page: 1 }))
  }

  const openResolveModal = (id, status) => {
    setResolveTarget({ id, status })
    setResolutionNotes('')
  }

  const closeResolveModal = () => {
    setResolveTarget(null)
    setResolutionNotes('')
  }

  const confirmResolve = async () => {
    if (resolveTarget.status === 'Dismissed' && !resolutionNotes.trim()) {
      return toast.error('Please add a note explaining why this is being dismissed')
    }

    setSubmitting(true)
    const result = await dispatch(
      resolveReportThunk({
        reportId: resolveTarget.id,
        status: resolveTarget.status,
        resolutionNotes,
      }),
    )
    setSubmitting(false)

    if (resolveReportThunk.fulfilled.match(result)) {
      toast.success(`Report marked as ${resolveTarget.status}`)
      closeResolveModal()
    } else {
      toast.error(result.payload || 'Failed to resolve report')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Entity Type</label>
          <select
            name="entityType"
            value={filters.entityType}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            <option value="">All entities</option>
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={applyFilters}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {loading && adminReports.length === 0 ? (
        <TableSkeleton columns={6} />
      ) : adminReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No reports found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Reporter</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminReports.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 text-gray-700">
                    <span className="block font-medium">{r.entity_label || <span className="italic text-gray-400">Deleted {r.entity_type}</span>}</span>
                    <span className="block text-xs text-gray-400 capitalize">{r.entity_type}</span>
                    {r.entity_type === 'seller' && r.entity_label && (
                      <Link to={`/admin/sellers/${r.entity_id}`} className="text-xs text-teal-600 hover:underline">
                        View Seller →
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <span className="block">{r.reason}</span>
                    {r.description && (
                      <span className="block text-xs text-gray-400 mt-0.5">{r.description}</span>
                    )}
                    {r.status !== 'Pending' && r.resolution_notes && (
                      <span className="block text-xs text-gray-400 mt-1 italic">
                        Note: {r.resolution_notes}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.reporter_name}
                    <span className="block text-xs text-gray-400">{r.reporter_email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={r.status} variant={STATUS_VARIANTS[r.status]} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'Pending' ? (
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => openResolveModal(r.id, 'Dismissed')}>
                          Dismiss
                        </Button>
                        <Button size="sm" onClick={() => openResolveModal(r.id, 'Resolved')}>
                          Resolve
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {r.resolved_by_name ? `by ${r.resolved_by_name}` : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={load} />

      <Modal
        isOpen={!!resolveTarget}
        onClose={closeResolveModal}
        title={resolveTarget?.status === 'Resolved' ? 'Resolve Report' : 'Dismiss Report'}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            This message is sent directly to the person who filed the report — write it as you would to them, not as an internal note.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Message to reporter {resolveTarget?.status === 'Dismissed' ? '(required)' : '(optional)'}
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 resize-none"
              placeholder={
                resolveTarget?.status === 'Resolved'
                  ? "e.g. We've contacted the seller about this and it will be resolved within 3 business days. Thank you for letting us know."
                  : "e.g. We've reviewed this and it doesn't violate our policies."
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeResolveModal}>Cancel</Button>
            <Button size="sm" onClick={confirmResolve} disabled={submitting}>
              {submitting ? 'Saving...' : `Confirm ${resolveTarget?.status}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Reports