import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import Loader from '../components/ui/Loader'
import AdminLayout from '../components/admin/AdminLayout'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, sessionChecked } = useSelector((state) => state.auth)

  if (!sessionChecked) {
    return <Loader fullScreen />
  }

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role !== 'Admin') return <Navigate to="/" replace />

  return <AdminLayout>{children}</AdminLayout>
}

export default AdminRoute