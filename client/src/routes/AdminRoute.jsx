import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import Loader from '../components/ui/Loader'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, sessionChecked } = useSelector((state) => state.auth)

  if (!sessionChecked) {
    return <Loader fullScreen />
  }

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role !== 'Admin') return <Navigate to="/" replace />

  return children
}

export default AdminRoute