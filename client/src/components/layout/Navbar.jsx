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
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { mySeller } = useSelector((state) => state.seller);
  const { items } = useSelector((state) => state.cart);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={logo} alt="ShopSmart AI" className="h-9 w-auto" />
              <span className="font-bold text-xl text-teal-600 hidden sm:block">
                ShopSmart AI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <Link to="/" className="hover:text-teal-600 transition-colors">
                Home
              </Link>
              <Link
                to="/products"
                className="hover:text-teal-600 transition-colors"
              >
                Products
              </Link>
              <Link
                to="/about"
                className="hover:text-teal-600 transition-colors"
              >
                About
              </Link>
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center h-9 w-9 text-gray-600 hover:text-teal-600 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
              </button>

              <button
                onClick={() => dispatch(openCartDrawer())}
                className="flex items-center justify-center h-9 w-9 text-gray-600 hover:text-teal-600 transition-colors"
              >
                <span className="relative inline-flex">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm7 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-teal-600 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </span>
              </button>

              {isAuthenticated ? (
                <>
                  <NotificationBell />
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
                        <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-medium ring-2 ring-white shadow-sm">
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
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                        {user?.role === "Admin" && (
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="block px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 transition-colors"
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        {mySeller?.status === "Approved" && (
                          <Link
                            to="/seller"
                            onClick={() => setIsProfileOpen(false)}
                            className="block px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 transition-colors"
                          >
                            Seller Dashboard
                          </Link>
                        )}
                        {user?.role !== "Admin" && mySeller?.status !== "Approved" && (
                          <Link
                            to="/become-seller"
                            onClick={() => setIsProfileOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Become a Seller
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
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => dispatch(openLoginModal())}
                    className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => dispatch(openRegisterModal())}
                    className="text-sm font-medium bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden flex items-center justify-center h-9 w-9 text-gray-600 hover:text-teal-600 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3 flex flex-col gap-1 text-sm font-medium text-gray-600">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="py-2 hover:text-teal-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={closeMobileMenu}
              className="py-2 hover:text-teal-600 transition-colors"
            >
              Products
            </Link>
            <Link
              to="/about"
              onClick={closeMobileMenu}
              className="py-2 hover:text-teal-600 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 p-4 sm:p-6">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                autoFocus
                className="flex-1 text-base sm:text-lg outline-none text-gray-800 placeholder-gray-400 py-2"
              />
              <button
                type="submit"
                className="text-teal-600 font-semibold text-sm sm:text-base hover:text-teal-700 transition-colors whitespace-nowrap"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
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
