import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { applyCouponCode } from '../../api/couponApi'

export const applyCoupon = createAsyncThunk(
  'coupon/applyCoupon',
  async ({ code, cartTotal }, { rejectWithValue }) => {
    try {
      const res = await applyCouponCode({ code, cartTotal })
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Coupon validation failed')
    }
  },
)

const initialState = {
  coupon: null,        // { code, type, discountValue }
  discount: 0,          // numeric discountAmount
  finalAmount: null,    // numeric finalAmount, for reference/display
  appliedForTotal: null, // the cartTotal this discount was validated against —
                         // used to detect a stale coupon if cart changes after applying
  loading: false,
  error: null,
}

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    removeCoupon: (state) => {
      state.coupon = null
      state.discount = 0
      state.finalAmount = null
      state.appliedForTotal = null
      state.error = null
    },
    clearCouponError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false
        state.coupon = action.payload.coupon
        state.discount = Number(action.payload.discountAmount)
        state.finalAmount = Number(action.payload.finalAmount)
        state.appliedForTotal = Number(action.payload.cartTotal)
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.coupon = null
        state.discount = 0
        state.finalAmount = null
        state.appliedForTotal = null
      })
  },
})

export const { removeCoupon, clearCouponError } = couponSlice.actions
export default couponSlice.reducer