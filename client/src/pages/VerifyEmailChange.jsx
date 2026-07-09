import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'react-hot-toast'
import { confirmEmailChange } from '../store/slices/authSlice'
import Loader from '../components/ui/Loader'

const VerifyEmailChange = () => {
  const { token } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    dispatch(confirmEmailChange(token))
      .unwrap()
      .then(() => {
        setStatus('success')
        toast.success('Email updated successfully!')
        setTimeout(() => navigate('/profile'), 1500)
      })
      .catch((err) => {
        setStatus('error')
        setErrorMessage(err || 'Invalid or expired link.')
      })
  }, [token, dispatch])

  if (status === 'loading') return <Loader fullScreen />

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <h2 className="text-xl font-semibold text-gray-700">Confirmation Failed</h2>
        <p className="text-sm text-gray-500">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
      <h2 className="text-xl font-semibold text-gray-700">Email Confirmed!</h2>
      <p className="text-sm text-gray-500">Redirecting to your profile...</p>
    </div>
  )
}

export default VerifyEmailChange