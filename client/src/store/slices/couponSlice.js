import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { applyCouponCode } from "../../api/couponApi";
import { login, fetchMe, googleLogin, googleSignup, logout } from "./authSlice";

export const applyCoupon = createAsyncThunk(
  "coupon/applyCoupon",
  async ({ code, cartTotal }, { rejectWithValue }) => {
    try {
      const res = await applyCouponCode({ code, cartTotal });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Coupon validation failed",
      );
    }
  },
);

const COUPON_KEY_PREFIX = "shopsmart_coupon_";
export const getCouponKey = (userId) => `${COUPON_KEY_PREFIX}${userId}`;

const initialState = {
  coupon: null,
  discount: 0,
  finalAmount: null,
  appliedForTotal: null,
  pendingCode: null,
  loading: false,
  error: null,
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;
      state.finalAmount = null;
      state.appliedForTotal = null;
      state.error = null;
    },
    clearCouponError: (state) => {
      state.error = null;
    },
    clearPendingCode: (state) => {
      state.pendingCode = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupon = action.payload.coupon;
        state.discount = Number(action.payload.discountAmount);
        state.finalAmount = Number(action.payload.finalAmount);
        state.appliedForTotal = Number(action.payload.cartTotal);
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.coupon = null;
        state.discount = 0;
        state.finalAmount = null;
        state.appliedForTotal = null;
      });

    const restorePendingCode = (state, action) => {
      const userId = action.payload.user?.id;
      if (!userId) return;
      try {
        const saved = localStorage.getItem(getCouponKey(userId));
        state.pendingCode = saved || null;
      } catch {
        state.pendingCode = null;
      }
    };

    builder
      .addCase(login.fulfilled, restorePendingCode)
      .addCase(fetchMe.fulfilled, restorePendingCode)
      .addCase(googleLogin.fulfilled, restorePendingCode)
      .addCase(googleSignup.fulfilled, restorePendingCode)
      .addCase(logout.fulfilled, (state) => {
        state.coupon = null;
        state.discount = 0;
        state.finalAmount = null;
        state.appliedForTotal = null;
        state.pendingCode = null;
      });
  },
});

export const { removeCoupon, clearCouponError, clearPendingCode } =
  couponSlice.actions;
export default couponSlice.reducer;
