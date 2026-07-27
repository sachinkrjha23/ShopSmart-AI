import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-teal-600 mb-2">404</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          This page took a wrong turn
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you're looking for doesn't exist, may have been moved, or the link might be broken.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="bg-teal-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            to="/products"
            className="border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound