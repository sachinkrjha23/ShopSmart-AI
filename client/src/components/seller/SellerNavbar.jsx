import { Link } from 'react-router-dom'

const SellerNavbar = ({ storeName, onMenuClick }) => {
  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-500 hover:text-gray-700"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="flex items-center gap-1.5 text-base font-semibold text-gray-700 hover:text-teal-600 transition-colors whitespace-nowrap">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Back to Store</span>
        </Link>
      </div>
      {storeName && <span className="text-sm text-gray-400">{storeName}</span>}
    </div>
  )
}

export default SellerNavbar