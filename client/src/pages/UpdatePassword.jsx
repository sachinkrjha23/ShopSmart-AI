import PasswordForm from '../components/profile/PasswordForm'

const UpdatePassword = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Update Password</h1>
      <div className="max-w-xl bg-white rounded-xl border border-gray-100 p-6">
        <PasswordForm />
      </div>
    </div>
  )
}

export default UpdatePassword