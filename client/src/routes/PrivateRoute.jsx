import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import Loader from '../components/ui/Loader'

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, sessionChecked } = useSelector((state) => state.auth)
  
  if (!sessionChecked) {
    return <Loader fullScreen />
  }

  return isAuthenticated ? children : <Navigate to="/" replace />
}

export default PrivateRoute