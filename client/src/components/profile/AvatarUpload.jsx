import { useRef } from 'react'
import { toast } from 'react-hot-toast'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
const MAX_SIZE = 600 * 1024 // 600KB — matches backend limit exactly

const AvatarUpload = ({ displayUrl, userName, onFileSelect, onRemove, disabled }) => {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WEBP).')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image size must be less than 600KB.')
      return
    }

    onFileSelect(file)
  }

  const initials = userName?.trim()?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="flex items-center gap-5">
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={userName || 'Avatar'}
          className="h-20 w-20 rounded-full object-cover border border-gray-200"
        />
      ) : (
        <div className="h-20 w-20 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-2xl font-semibold border border-gray-200">
          {initials}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {displayUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {displayUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default AvatarUpload