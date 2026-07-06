import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { verifyEmail } from '../store/slices/authSlice'
import Loader from '../components/ui/Loader'
import { toast } from 'react-hot-toast'

const VerifyEmail = () => {
  const { token } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(verifyEmail(token))
  }, [token, dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      toast.success('Email verified! Welcome to ShopSmart AI.')
      navigate('/')
    }
  }, [isAuthenticated])

  if (loading) return <Loader fullScreen />

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <h2 className="text-xl font-semibold text-gray-700">Verification Failed</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  return null
}

export default VerifyEmail