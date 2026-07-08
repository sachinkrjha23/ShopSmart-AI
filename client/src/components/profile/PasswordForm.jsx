import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { changePassword } from '../../store/slices/authSlice'
import Input from '../ui/Input'
import Button from '../ui/Button'

const PasswordForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    const { currentPassword, newPassword, confirmNewPassword } = formData

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Please fill in all required fields')
      return false
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match')
      return false
    }
    if (newPassword === currentPassword) {
      toast.error('New password cannot be the same as current password')
      return false
    }
    if (newPassword.length < 8 || newPassword.length > 16) {
      toast.error('Password must be between 8 and 16 characters')
      return false
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error('Password must contain at least one lowercase letter')
      return false
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number')
      return false
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      toast.error('Password must contain at least one special character')
      return false
    }
    if (/\s/.test(newPassword)) {
      toast.error('Password cannot contain spaces')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await dispatch(changePassword(formData)).unwrap()
      toast.success('Password updated successfully!')
      setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
      navigate('/profile')
    } catch (err) {
      toast.error(err || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Current Password"
        name="currentPassword"
        type="password"
        value={formData.currentPassword}
        onChange={handleChange}
        placeholder="Enter current password"
        disabled={loading}
        required
      />
      <Input
        label="New Password"
        name="newPassword"
        type="password"
        value={formData.newPassword}
        onChange={handleChange}
        placeholder="Enter new password"
        disabled={loading}
        required
      />
      <Input
        label="Confirm New Password"
        name="confirmNewPassword"
        type="password"
        value={formData.confirmNewPassword}
        onChange={handleChange}
        placeholder="Confirm new password"
        disabled={loading}
        required
      />
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  )
}

export default PasswordForm