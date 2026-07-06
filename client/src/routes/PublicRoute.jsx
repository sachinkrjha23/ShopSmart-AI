import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import Loader from '../components/ui/Loader'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, sessionChecked } = useSelector((state) => state.auth)

  if (!sessionChecked) {
    return <Loader fullScreen />
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children
}

export default PublicRoute