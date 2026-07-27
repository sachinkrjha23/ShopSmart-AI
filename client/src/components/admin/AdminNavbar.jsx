import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { logout } from '../../store/slices/authSlice'

const AdminNavbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = async () => {
    await dispatch(logout())
    toast.success('Logged out successfully!')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6">
      <Link to="/" className="text-base font-semibold text-gray-700   hover:text-teal-600 transition-colors">
        ← Back to Store
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">{user?.name}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default AdminNavbar