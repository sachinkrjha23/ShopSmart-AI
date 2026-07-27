import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/sellers', label: 'Sellers' },
  { to: '/admin/returns', label: 'Returns' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/activity-log', label: 'Activity Log' },
  { to: '/admin/reports', label: 'Reports' },
]

const AdminSidebar = () => {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen p-4">
      <div className="mb-6 px-2">
        <span className="text-lg font-bold text-teal-600">ShopSmart</span>
        <span className="block text-xs text-gray-400">Admin Panel</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar