import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import cartReducer, { getCartKey } from './slices/cartSlice'
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

let lastPersistedSnapshot = null

store.subscribe(() => {
  const { cart } = store.getState()
  const { currentUserId, items, totalQuantity, totalPrice } = cart

  if (!currentUserId) return

  const snapshot = JSON.stringify({ items, totalQuantity, totalPrice })
  if (snapshot === lastPersistedSnapshot) return

  lastPersistedSnapshot = snapshot

  try {
    localStorage.setItem(getCartKey(currentUserId), snapshot)
  } catch (error) {
    console.error('Failed to persist cart to localStorage:', error)
  }
})

export default store