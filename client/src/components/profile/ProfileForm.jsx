import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { editProfile } from '../../store/slices/authSlice'
import Input from '../ui/Input'
import Button from '../ui/Button'
import AvatarUpload from './AvatarUpload'

const ProfileForm = ({ user }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Keep in sync if the user object changes from outside (e.g. after save)
  useEffect(() => {
    setFormData({ name: user?.name || '', email: user?.email || '' })
  }, [user?.name, user?.email])

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileSelect = (file) => {
    setAvatarFile(file)
    setRemoveAvatar(false) // picking a new photo cancels any pending removal
  }

  const handleRemove = () => {
    setAvatarFile(null)
    setRemoveAvatar(true)
  }

  const validate = () => {
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim()
    if (!trimmedName || !trimmedEmail) {
      toast.error('Please fill in all required fields')
      return false
    }
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      toast.error('Name must be between 2 and 50 characters')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Please provide a valid email address')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const data = new FormData()
    data.append('name', formData.name.trim())
    data.append('email', formData.email.trim())
    if (avatarFile) {
      data.append('avatar', avatarFile)
    } else if (removeAvatar) {
      data.append('removeAvatar', 'true')
    }

    try {
      await dispatch(editProfile(data)).unwrap()
      toast.success('Profile updated successfully!')
      setAvatarFile(null)
      setRemoveAvatar(false)
    } catch (err) {
      toast.error(err || 'Something went wrong')
    }
  }

  const displayUrl = removeAvatar ? null : previewUrl || user?.avatar?.url || null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <AvatarUpload
        displayUrl={displayUrl}
        userName={user?.name}
        onFileSelect={handleFileSelect}
        onRemove={handleRemove}
        disabled={loading}
      />

      <Input
        label="Full Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Your full name"
        disabled={loading}
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="you@example.com"
        disabled={loading}
        required
      />

      <div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

export default ProfileForm