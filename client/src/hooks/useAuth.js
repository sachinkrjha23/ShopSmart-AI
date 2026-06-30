import { useSelector } from 'react-redux'

const useAuth = () => {
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth)
  return { user, isAuthenticated, loading, error }
}

export default useAuth