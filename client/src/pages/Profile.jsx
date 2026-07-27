import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import ProfileForm from '../components/profile/ProfileForm'
import DeleteAccountSection from '../components/profile/DeleteAccountSection'

const QUICK_LINKS = [
  { to: '/orders', label: 'My Orders', description: 'Track, view, or cancel your orders' },
  { to: '/wishlist', label: 'Wishlist', description: "Items you've saved for later" },
  { to: '/addresses', label: 'Addresses', description: 'Manage your saved addresses' },
  { to: '/update-password', label: 'Update Password', description: 'Change your account password' },
]

const Profile = () => {
  const { user } = useAuth()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          <ProfileForm user={user} />
        </div>

        <div className="flex flex-col gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:border-teal-200 hover:shadow-sm transition-all"
            >
              <p className="text-sm font-semibold text-gray-800">{link.label}</p>
              <p className="text-xs text-gray-500 mt-1">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <DeleteAccountSection />
    </div>
  )
}

export default Profile