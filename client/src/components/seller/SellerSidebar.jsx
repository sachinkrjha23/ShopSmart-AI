import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/seller', label: 'Dashboard', end: true },
  { to: '/seller/products', label: 'Products' },
  { to: '/seller/orders', label: 'Orders' },
  { to: '/seller/coupons', label: 'Coupons' },
  { to: '/seller/returns', label: 'Returns' },
]

const SellerSidebar = ({ isOpen = false, onClose = () => {} }) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 p-4 overflow-y-auto transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-auto md:w-56 md:shrink-0 md:min-h-screen`}
      >
        <div className="mb-6 px-2 flex items-center justify-between">
          <Link to="/" onClick={onClose} className="block">
            <span className="font-bold text-xl text-teal-600">ShopSmart</span>
            <p className="text-xs text-gray-400 mt-0.5">Seller Panel</p>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-600"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default SellerSidebar