import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../../store/slices/authSlice'
import { closeRegisterModal, openLoginModal } from '../../store/slices/uiSlice'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { toast } from 'react-hot-toast'

const RegisterModal = () => {
  const dispatch = useDispatch()
  const { isRegisterModalOpen } = useSelector((state) => state.ui)
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(closeRegisterModal())
      toast.success('Account created successfully!')
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return toast.error('Please fill in all fields')
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    dispatch(register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    }))
  }

  const switchToLogin = () => {
    dispatch(closeRegisterModal())
    dispatch(openLoginModal())
  }

  return (
    <Modal
      isOpen={isRegisterModalOpen}
      onClose={() => dispatch(closeRegisterModal())}
      title="Create Account"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </Button>
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={switchToLogin}
            className="text-indigo-600 font-medium hover:underline"
          >
            Login
          </button>
        </p>
      </form>
    </Modal>
  )
}

export default RegisterModal