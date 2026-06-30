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
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ShopSmart AI" className="h-9 w-auto" />
            <span className="font-bold text-lg text-indigo-600 hidden sm:block">
              ShopSmart AI
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
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

          {/* Right Side Icons */}
          <div className="flex items-center gap-5">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
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

            {/* Cart Icon */}
            <button
              onClick={() => dispatch(openCartDrawer())}
              className="relative text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
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
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2"
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    {user?.role === "Admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-indigo-600 hover:bg-gray-50"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Wishlist
                    </Link>
                    <Link
                      to="/addresses"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Addresses
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
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
                  className="text-sm font-medium text-gray-700 border border-gray-300 px-4 py-1.5 hover:bg-gray-800 hover:text-white hover:border-gray-800 active:bg-gray-900 transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {isSearchOpen && (
  <div
    className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center"
    style={{ paddingTop: '100px' }}
  >
    <div className="bg-white rounded-md shadow-xl w-full max-w-2xl mx-4 p-8">
      <form onSubmit={handleSearch} className="flex items-center gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for products..."
          autoFocus
          style={{ fontSize: '20px', padding: '14px 0' }}
          className="flex-1 outline-none text-gray-800 placeholder-gray-400"
        />
        <button type="submit" className="text-indigo-600 font-medium text-base">
          Search
        </button>
        <button
          type="button"
          onClick={() => setIsSearchOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          &times;
        </button>
      </form>
    </div>
  </div>
)}
    </>
  );
};

export default Navbar;
