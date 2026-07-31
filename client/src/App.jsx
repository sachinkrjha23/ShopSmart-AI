import { Routes, Route, useLocation  } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchMe } from "./store/slices/authSlice";
import PrivateRoute from "./routes/PrivateRoute";
import AdminRoute from "./routes/AdminRoute";
import PublicRoute from "./routes/PublicRoute";

// Pages - Customer
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import SearchResults from "./pages/SearchResults";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import Addresses from "./pages/Addresses";
import UpdatePassword from "./pages/UpdatePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ReturnPolicy from "./pages/ReturnPolicy";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailChange from "./pages/VerifyEmailChange";

// Pages - Admin
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import Users from "./pages/admin/Users";
import Reviews from "./pages/admin/Reviews";
import Coupons from "./pages/admin/Coupons";
import Settings from "./pages/admin/Settings";
import ActivityLog from "./pages/admin/ActivityLog";
import Reports from "./pages/admin/Reports";
import Broadcasts from "./pages/admin/Broadcasts";


import Navbar from "./components/layout/Navbar";
import LoginModal from "./components/auth/LoginModal";
import RegisterModal from "./components/auth/RegisterModal";
import CartDrawer from "./components/layout/CartDrawer";
import Footer from "./components/layout/Footer";
import { Toaster } from "react-hot-toast";
import { fetchWishlist } from "./store/slices/wishlistSlice";
import { useSelector } from "react-redux";
import Messages from "./pages/admin/Messages";
import ScrollToTop from "./components/layout/ScrollToTop";


// Seller
import SellerRoute from "./routes/SellerRoute";
import BecomeSeller from "./pages/BecomeSeller";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerOrderDetail from "./pages/seller/SellerOrderDetail";
import SellerAddProduct from "./pages/seller/AddProduct";
import SellerEditProduct from "./pages/seller/EditProduct";
import SellerProfile from "./pages/SellerProfile";
import SellerCoupons from "./pages/seller/Coupons";
import SellerReturns from "./pages/seller/Returns";

// Seller - Admin
import AdminSellers from "./pages/admin/Sellers";
import AdminSellerDetail from "./pages/admin/SellerDetail";
import { fetchMySellerProfile } from "./store/slices/sellerSlice";
import AdminReturns from "./pages/admin/Returns";

import NotificationInbox from "./pages/NotificationInbox";

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isSellerRoute = location.pathname === "/seller" || location.pathname.startsWith("/seller/");  const { isAuthenticated, sessionChecked } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (sessionChecked && isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [sessionChecked, isAuthenticated, dispatch]);

  useEffect(() => {
    if (sessionChecked && isAuthenticated) {
      dispatch(fetchMySellerProfile());
    }
  }, [sessionChecked, isAuthenticated, dispatch]);

  return (
    <>
      <Toaster
        position="top-right"
        containerStyle={{ top: 80 }}
        toastOptions={{
          duration: 3000,
        }}
      />
      <ScrollToTop />
      {!isAdminRoute && !isSellerRoute && (
        <>
          <Navbar />
          <LoginModal />
          <RegisterModal />
          <CartDrawer />
        </>
      )}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        <Route path="/products" element={<Products />} />

        <Route path="/products/:id" element={<ProductDetail />} />

        <Route path="/search" element={<SearchResults />} />

        <Route path="/cart" element={<Cart />} />

        <Route path="/about" element={<About />} />

        <Route path="/faq" element={<FAQ />} />

        <Route path="/contact" element={<ContactUs />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        <Route path="/terms" element={<TermsAndConditions />} />

        <Route path="/return-policy" element={<ReturnPolicy />} />

        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        <Route path="/verify-email-change/:token" element={<VerifyEmailChange />} />

        {/* ****************************************************************** */}

        {/* Public Only Routes (redirect if logged in) */}
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword/></        PublicRoute>}
        />

        <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>}
        />

        {/* ************************************************************************************* */}

        {/* Private Routes (redirect if not logged in) */}
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
        <Route path="/payment-failed" element={<PrivateRoute><PaymentFailed /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationInbox /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
        <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/addresses" element={<PrivateRoute><Addresses /></PrivateRoute>} />
        <Route path="/update-password" element={<PrivateRoute><UpdatePassword /></PrivateRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/products/add" element={<AdminRoute><AddProduct /></AdminRoute>} />
        <Route path="/admin/products/edit/:id" element={<AdminRoute><EditProduct /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="/admin/reviews" element={<AdminRoute><Reviews /></AdminRoute>} />
        <Route path="/admin/coupons" element={<AdminRoute><Coupons /></AdminRoute>} />
        <Route path="/admin/messages" element={<AdminRoute><Messages /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/returns" element={<AdminRoute><AdminReturns /></AdminRoute>} />
        <Route path="/admin/activity-log" element={<AdminRoute><ActivityLog /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="/admin/broadcasts" element={<AdminRoute><Broadcasts /></AdminRoute>} />

        {/* Seller */}
        <Route path="/become-seller" element={<PrivateRoute><BecomeSeller /></PrivateRoute>} />
        <Route path="/seller" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
        <Route path="/seller/products" element={<SellerRoute><SellerProducts /></SellerRoute>} />
        <Route path="/seller/orders" element={<SellerRoute><SellerOrders /></SellerRoute>} />
        <Route path="/seller/orders/:id" element={<SellerRoute><SellerOrderDetail /></SellerRoute>} />
        <Route path="/seller/products/add" element={<SellerRoute><SellerAddProduct /></SellerRoute>} />
        <Route path="/seller/products/edit/:id" element={<SellerRoute><SellerEditProduct /></SellerRoute>} />
        <Route path="/seller/coupons" element={<SellerRoute><SellerCoupons /></SellerRoute>} />
        <Route path="/seller/returns" element={<SellerRoute><SellerReturns /></SellerRoute>} />

        {/* Seller - Admin */}
        <Route path="/admin/sellers" element={<AdminRoute><AdminSellers /></AdminRoute>} />
        <Route path="/admin/sellers/:id" element={<AdminRoute><AdminSellerDetail /></AdminRoute>} />

        <Route path="/sellers/:sellerId" element={<SellerProfile />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && !isSellerRoute && <Footer />}
    </>
  );
};

export default App;