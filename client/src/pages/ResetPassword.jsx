import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { resetPassword } from '../api/authApi'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.password || !formData.confirmPassword) {
      return toast.error('Please fill in all fields')
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match')
    }

    try {
      setLoading(true)
      await resetPassword(token, {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })
      toast.success('Password reset successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Reset Password</h2>
        <p className="text-gray-600 text-sm mb-6">
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter new password"
            required
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            required
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword