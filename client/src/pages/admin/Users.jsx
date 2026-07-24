import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchAllUsers, deleteUser } from '../../store/slices/adminSlice'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import Loader from '../../components/ui/Loader'

const avatarColors = [
  'bg-indigo-100 text-indigo-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-amber-100 text-amber-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
]

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

const AdminUsers = () => {
  const dispatch = useDispatch()
  const { users, totalUsers, currentPage, loading } = useSelector((state) => state.admin)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const totalPages = Math.max(1, Math.ceil(totalUsers / 10))

  useEffect(() => {
    dispatch(fetchAllUsers(1))
  }, [dispatch])

  const handlePageChange = (page) => {
    dispatch(fetchAllUsers(page))
  }

  const handleDeleteConfirm = async () => {
  const id = deleteTarget
  setDeleteTarget(null)
  try {
    await dispatch(deleteUser({ id })).unwrap()
    toast.success('User deleted successfully.')
  } catch (err) {
    toast.error(err || 'Failed to delete user')
  }
}

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>

      {loading && users.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No users found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const avatarUrl = user.avatar?.url || null
                const initials = getInitials(user.name)

                return (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${avatarColors[index % avatarColors.length]}`}
                          >
                            {initials}
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={user.is_email_verified ? 'Verified' : 'Unverified'}
                        variant={user.is_email_verified ? 'success' : 'default'}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(user.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message="This will permanently anonymize this user's account and personal data. Their past orders will be kept for records but no longer tied to an active account. This cannot be undone."
        confirmLabel="Delete User"
        variant="danger"
      />
    </div>
  )
}

export default AdminUsers