import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'
import productReducer from './slices/productSlice'
import wishlistReducer from './slices/wishlistSlice'
import orderReducer from './slices/orderSlice'
import addressReducer from './slices/addressSlice'
import couponReducer from './slices/couponSlice'
import adminReducer from './slices/adminSlice'
import uiReducer from './slices/uiSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    product: productReducer,
    wishlist: wishlistReducer,
    order: orderReducer,
    address: addressReducer,
    coupon: couponReducer,
    admin: adminReducer,
    ui: uiReducer,
  },
})

export default store