import useAuth from '../hooks/useAuth'
import ProfileForm from '../components/profile/ProfileForm'

const Profile = () => {
  const { user } = useAuth()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="max-w-xl bg-white rounded-xl border border-gray-100 p-6">
        <ProfileForm user={user} />
      </div>
    </div>
  )
}

export default Profile