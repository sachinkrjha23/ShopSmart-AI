// src/components/layout/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { logout } from "../../store/slices/authSlice";
import {
  openLoginModal,
  openRegisterModal,
  openCartDrawer,
} from "../../store/slices/uiSlice";
import { toast } from "react-hot-toast";
import logo from "../../assets/images/logo.png";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { mySeller } = useSelector((state) => state.seller);
  const { items } = useSelector((state) => state.cart);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success("Logged out successfully!");
    setIsProfileOpen(false);
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Left */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={logo} alt="ShopSmart AI" className="h-9 w-auto" />
              <span className="font-bold text-xl text-indigo-600 hidden sm:block">
                ShopSmart AI
              </span>
            </Link>

            {/* Nav Links - Center */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <Link to="/" className="hover:text-indigo-600 transition-colors">
                Home
              </Link>
              <Link
                to="/products"
                className="hover:text-indigo-600 transition-colors"
              >
                Products
              </Link>
              <Link
                to="/about"
                className="hover:text-indigo-600 transition-colors"
              >
                About
              </Link>
            </div>

            {/* Right Actions - Right aligned */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </button>

              {/* Cart */}
              <button
                onClick={() => dispatch(openCartDrawer())}
                className="relative text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm7 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Auth / Profile */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    {user?.avatar?.url ? (
                      <img
                        src={user.avatar.url}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium ring-2 ring-white shadow-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      {user?.role === "Admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="block px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      {mySeller?.status === "Approved" && (
                        <Link
                          to="/seller"
                          onClick={() => setIsProfileOpen(false)}
                          className="block px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          Seller Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Wishlist
                      </Link>
                      <Link
                        to="/addresses"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Addresses
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1 pt-2"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => dispatch(openLoginModal())}
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => dispatch(openRegisterModal())}
                    className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6">
            <form onSubmit={handleSearch} className="flex items-center gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                autoFocus
                className="flex-1 text-xl outline-none text-gray-800 placeholder-gray-400 py-3"
              />
              <button
                type="submit"
                className="text-indigo-600 font-semibold text-base hover:text-indigo-700 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;