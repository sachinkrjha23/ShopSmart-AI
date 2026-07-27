import { Link } from 'react-router-dom'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold text-teal-600">ShopSmart</span>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Shopping made smarter — AI-powered recommendations, secure checkout, and
              a store that actually helps you find what you're looking for.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Shop</h3>
            <ul className="flex flex-col gap-2 text-sm text-gray-500">
              <li><Link to="/products" className="hover:text-teal-600">All Products</Link></li>
              <li><Link to="/cart" className="hover:text-teal-600">Cart</Link></li>
              <li><Link to="/wishlist" className="hover:text-teal-600">Wishlist</Link></li>
              <li><Link to="/orders" className="hover:text-teal-600">My Orders</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Company</h3>
            <ul className="flex flex-col gap-2 text-sm text-gray-500">
              <li><Link to="/about" className="hover:text-teal-600">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-teal-600">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-teal-600">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Legal</h3>
            <ul className="flex flex-col gap-2 text-sm text-gray-500">
              <li><Link to="/privacy-policy" className="hover:text-teal-600">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-teal-600">Terms & Conditions</Link></li>
              <li><Link to="/return-policy" className="hover:text-teal-600">Return Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {year} ShopSmart AI. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">Made with care, powered by AI.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer