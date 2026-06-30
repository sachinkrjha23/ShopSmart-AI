import { Routes, Route } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import AdminRoute from './routes/AdminRoute'
import PublicRoute from './routes/PublicRoute'

// Pages - Customer
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import SearchResults from './pages/SearchResults'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailed from './pages/PaymentFailed'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Wishlist from './pages/Wishlist'
import Profile from './pages/Profile'
import Addresses from './pages/Addresses'
import UpdatePassword from './pages/UpdatePassword'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import About from './pages/About'
import FAQ from './pages/FAQ'
import ContactUs from './pages/ContactUs'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
import ReturnPolicy from './pages/ReturnPolicy'
import NotFound from './pages/NotFound'

// Pages - Admin
import Dashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AddProduct from './pages/admin/AddProduct'
import EditProduct from './pages/admin/EditProduct'
import AdminOrders from './pages/admin/Orders'
import AdminOrderDetail from './pages/admin/OrderDetail'
import Users from './pages/admin/Users'
import Reviews from './pages/admin/Reviews'
import Coupons from './pages/admin/Coupons'
import Settings from './pages/admin/Settings'

const App = () => {
  return (
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

      {/* ****************************************************************** */}

      {/* Public Only Routes (redirect if logged in) */}
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* ************************************************************************************* */}

      {/* Private Routes (redirect if not logged in) */}
      <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />

      <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />

      <Route path="/payment-failed" element={<PrivateRoute><PaymentFailed /></PrivateRoute>} />

      <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />

      <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />

      <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />

      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

      <Route path="/addresses" element={<PrivateRoute><Addresses /></PrivateRoute>} />

      <Route path="/update-password" element={<PrivateRoute><UpdatePassword /></PrivateRoute>} />

      {/* **************************************************************************************** */ }

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
      
      <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
      

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App