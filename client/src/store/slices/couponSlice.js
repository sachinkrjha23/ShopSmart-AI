import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  applyCouponCode,
  getAdminCoupons,
  createAdminCoupon as createAdminCouponApi,
  updateAdminCoupon as updateAdminCouponApi,
  toggleAdminCoupon as toggleAdminCouponApi,
  deleteAdminCoupon as deleteAdminCouponApi,
} from "../../api/couponApi";
import { login, fetchMe, googleLogin, googleSignup, logout } from "./authSlice";

export const applyCoupon = createAsyncThunk(
  "coupon/applyCoupon",
  async ({ code, cartItems }, { rejectWithValue }) => {
    try {
      const res = await applyCouponCode({ code, cartItems });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Coupon validation failed",
      );
    }
  },
);

export const fetchAdminCoupons = createAsyncThunk(
  "coupon/fetchAdminCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAdminCoupons();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch coupons",
      );
    }
  },
);

export const createAdminCoupon = createAsyncThunk(
  "coupon/createAdminCoupon",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createAdminCouponApi(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create coupon",
      );
    }
  },
);

export const updateAdminCoupon = createAsyncThunk(
  "coupon/updateAdminCoupon",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateAdminCouponApi(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update coupon",
      );
    }
  },
);

export const toggleAdminCoupon = createAsyncThunk(
  "coupon/toggleAdminCoupon",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleAdminCouponApi(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to toggle coupon",
      );
    }
  },
);

export const deleteAdminCoupon = createAsyncThunk(
  "coupon/deleteAdminCoupon",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteAdminCouponApi(id);
      return { id, ...res.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete coupon",
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
  adminCoupons: [],
  eligibleAmount: null,
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
      state.eligibleAmount = null;
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
        state.eligibleAmount = Number(action.payload.eligibleAmount);
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.coupon = null;
        state.discount = 0;
        state.finalAmount = null;
        state.appliedForTotal = null;
        state.eligibleAmount = null;
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
        state.eligibleAmount = null;
        state.pendingCode = null;
      });

    builder
      .addCase(fetchAdminCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.adminCoupons = action.payload.coupons || [];
      })
      .addCase(fetchAdminCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAdminCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdminCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.adminCoupons.unshift(action.payload.coupon);
      })
      .addCase(createAdminCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdminCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.coupon;
        const index = state.adminCoupons.findIndex((c) => c.id === updated.id);
        if (index !== -1) state.adminCoupons[index] = updated;
      })
      .addCase(updateAdminCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleAdminCoupon.fulfilled, (state, action) => {
        const updated = action.payload.coupon;
        const index = state.adminCoupons.findIndex((c) => c.id === updated.id);
        if (index !== -1) state.adminCoupons[index] = updated;
      })
      .addCase(toggleAdminCoupon.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteAdminCoupon.fulfilled, (state, action) => {
        state.adminCoupons = state.adminCoupons.filter((c) => c.id !== action.payload.id);
      })
      .addCase(deleteAdminCoupon.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { removeCoupon, clearCouponError, clearPendingCode } =
  couponSlice.actions;
export default couponSlice.reducer;