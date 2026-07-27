import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchAdminContactMessages, removeAdminContactMessage } from '../../store/slices/contactSlice'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import Loader from '../../components/ui/Loader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Tooltip from '../../components/ui/Tooltip'

const AdminMessages = () => {
  const dispatch = useDispatch()
  const { adminMessages, adminPagination, loading } = useSelector((state) => state.contact)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    dispatch(fetchAdminContactMessages({ page: 1, search: '' }))
  }, [dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(fetchAdminContactMessages({ page: 1, search }))
  }

  const handlePageChange = (page) => {
    dispatch(fetchAdminContactMessages({ page, search }))
  }

  const handleDeleteConfirm = async () => {
    const id = deleteTarget
    setDeleteTarget(null)
    try {
      await dispatch(removeAdminContactMessage(id)).unwrap()
      toast.success('Message deleted.')
    } catch (err) {
      toast.error(err || 'Failed to delete message')
    }
  }

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id)
    toast.success('Message ID copied to clipboard.')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
        <Input
          placeholder="Search by name, email, or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {loading && adminMessages.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : adminMessages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No messages yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {adminMessages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{msg.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{msg.name} · {msg.email}</p>
                  <Tooltip text={msg.id}>
                    <button
                      type="button"
                      onClick={() => handleCopyId(msg.id)}
                      className="text-xs text-gray-400 hover:text-teal-600 transition-colors mt-0.5"
                    >
                      #{msg.id.slice(0, 8).toUpperCase()}
                    </button>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(msg.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={adminPagination.currentPage}
        totalPages={adminPagination.totalPages}
        onPageChange={handlePageChange}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Message"
        message="This will permanently delete this message. This cannot be undone."
        confirmLabel="Delete Message"
        variant="danger"
      />
    </div>
  )
}

export default AdminMessages