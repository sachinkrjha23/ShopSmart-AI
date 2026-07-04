import { createSlice } from '@reduxjs/toolkit'
import { login, fetchMe, logout } from './authSlice'

export const MAX_DISTINCT_ITEMS = 20
export const MAX_QTY_PER_ITEM = 100

const CART_KEY_PREFIX = 'shopsmart_cart_'
export const getCartKey = (userId) => `${CART_KEY_PREFIX}${userId}`

const emptyCart = () => ({ items: [], totalQuantity: 0, totalPrice: 0 })

const loadCartForUser = (userId) => {
  if (!userId) return emptyCart()
  try {
    const raw = localStorage.getItem(getCartKey(userId))
    if (!raw) return emptyCart()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.items)) return emptyCart()
    return {
      items: parsed.items,
      totalQuantity: parsed.totalQuantity || 0,
      totalPrice: parsed.totalPrice || 0,
    }
  } catch {
    return emptyCart()
  }
}

const recalcTotals = (items) => {
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice =
    Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100
  return { totalQuantity, totalPrice }
}

const applyTotals = (state) => {
  const totals = recalcTotals(state.items)
  state.totalQuantity = totals.totalQuantity
  state.totalPrice = totals.totalPrice
}

const initialState = {
  items: [], // { productId, name, image, price, stock, quantity }
  totalQuantity: 0,
  totalPrice: 0,
  currentUserId: null, // whose cart is loaded — used by store.js for the localStorage key
  limitError: null,    // set when addToCart is blocked by MAX_DISTINCT_ITEMS
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { productId, name, image, price, stock, quantity = 1 } = action.payload
      state.limitError = null

      const existing = state.items.find((i) => i.productId === productId)

      if (existing) {
        const cap = Math.min(MAX_QTY_PER_ITEM, stock ?? MAX_QTY_PER_ITEM)
        existing.quantity = Math.min(existing.quantity + quantity, cap)
        existing.stock = stock ?? existing.stock
      } else {
        if (state.items.length >= MAX_DISTINCT_ITEMS) {
          state.limitError = `You can only have ${MAX_DISTINCT_ITEMS} different products in your cart.`
          return
        }
        const cap = Math.min(MAX_QTY_PER_ITEM, stock ?? MAX_QTY_PER_ITEM)
        state.items.push({
          productId,
          name,
          image,
          price,
          stock: stock ?? MAX_QTY_PER_ITEM,
          quantity: Math.min(quantity, cap),
        })
      }
      applyTotals(state)
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.productId !== action.payload)
      applyTotals(state)
    },

    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload
      const item = state.items.find((i) => i.productId === productId)
      if (item) {
        const cap = Math.min(MAX_QTY_PER_ITEM, item.stock ?? MAX_QTY_PER_ITEM)
        item.quantity = Math.max(1, Math.min(quantity, cap))
      }
      applyTotals(state)
    },

    clearCart: (state) => {
      state.items = []
      state.totalQuantity = 0
      state.totalPrice = 0
    },

    clearCartLimitError: (state) => {
      state.limitError = null
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        const userId = action.payload.user?.id
        state.currentUserId = userId || null
        Object.assign(state, loadCartForUser(userId))
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        const userId = action.payload.user?.id
        state.currentUserId = userId || null
        Object.assign(state, loadCartForUser(userId))
      })
      .addCase(fetchMe.rejected, (state) => {
        state.currentUserId = null
        state.items = []
        state.totalQuantity = 0
        state.totalPrice = 0
      })
      .addCase(logout.fulfilled, (state) => {
        state.currentUserId = null
        state.items = []
        state.totalQuantity = 0
        state.totalPrice = 0
      })
  },
})

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  clearCartLimitError,
} = cartSlice.actions

export default cartSlice.reducer