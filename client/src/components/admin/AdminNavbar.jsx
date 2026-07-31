import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { logout } from '../../store/slices/authSlice'

const AdminNavbar = ({ onMenuClick }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = async () => {
    await dispatch(logout())
    toast.success('Logged out successfully!')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-500 hover:text-gray-700"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="flex items-center gap-1.5 text-base font-semibold text-gray-700 hover:text-teal-600 transition-colors whitespace-nowrap">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Back to Store</span>
        </Link>
      </div>

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