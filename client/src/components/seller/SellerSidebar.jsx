import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/seller', label: 'Dashboard', end: true },
  { to: '/seller/products', label: 'Products' },
  { to: '/seller/orders', label: 'Orders' },
  { to: '/seller/coupons', label: 'Coupons' },
]

const SellerSidebar = () => {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen p-4">
      <Link to="/" className="block mb-6 px-2">
        <span className="font-bold text-xl text-indigo-600">ShopSmart</span>
        <p className="text-xs text-gray-400 mt-0.5">Seller Panel</p>
      </Link>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default SellerSidebar