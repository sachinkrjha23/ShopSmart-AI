import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  applyToBecomeSeller,
  getMySellerProfile,
  getAdminSellers,
  getAdminSingleSeller,
  adminApproveSeller,
  adminRejectSeller,
  adminSuspendSeller,
  getSellerDashboardStats,
  getSellerProducts,
  toggleSellerProduct,
  getSellerOrders,
  getSellerOrderDetail,
  createSellerProduct,
  getSellerSingleProduct,
  updateSellerProduct,
  updateFulfillmentStatus,
  getPublicSellerProfile,
  createSellerCoupon,
  getSellerCoupons,
  updateSellerCoupon,
  toggleSellerCoupon,
  deleteSellerCoupon,
  rateSellerApi,
  getMySellerRatingApi,
} from "../../api/sellerApi";
import { cancelSellerOrderItem as cancelSellerOrderItemApi } from "../../api/sellerApi";

// ASYNC THUNKS

export const applyForSeller = createAsyncThunk(
  "seller/applyForSeller",
  async (data, { rejectWithValue }) => {
    try {
      const response = await applyToBecomeSeller(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit application",
      );
    }
  },
);

export const fetchMySellerProfile = createAsyncThunk(
  "seller/fetchMySellerProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMySellerProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch seller profile",
      );
    }
  },
);

export const fetchAdminSellers = createAsyncThunk(
  "seller/fetchAdminSellers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminSellers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sellers",
      );
    }
  },
);

export const fetchAdminSingleSeller = createAsyncThunk(
  "seller/fetchAdminSingleSeller",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getAdminSingleSeller(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch seller",
      );
    }
  },
);

export const approveSeller = createAsyncThunk(
  "seller/approveSeller",
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminApproveSeller(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to approve seller",
      );
    }
  },
);

export const rejectSeller = createAsyncThunk(
  "seller/rejectSeller",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await adminRejectSeller(id, reason);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject seller",
      );
    }
  },
);

export const suspendSeller = createAsyncThunk(
  "seller/suspendSeller",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await adminSuspendSeller(id, reason);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to suspend seller",
      );
    }
  },
);

export const fetchSellerDashboardStats = createAsyncThunk(
  "seller/fetchSellerDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getSellerDashboardStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard stats",
      );
    }
  },
);

export const fetchSellerProducts = createAsyncThunk(
  "seller/fetchSellerProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getSellerProducts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products",
      );
    }
  },
);

export const toggleSellerProductStatus = createAsyncThunk(
  "seller/toggleSellerProductStatus",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await toggleSellerProduct(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update product",
      );
    }
  },
);

export const fetchSellerOrders = createAsyncThunk(
  "seller/fetchSellerOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getSellerOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders",
      );
    }
  },
);

export const fetchSellerOrderDetail = createAsyncThunk(
  "seller/fetchSellerOrderDetail",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await getSellerOrderDetail(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order",
      );
    }
  },
);

export const addSellerProduct = createAsyncThunk(
  "seller/addSellerProduct",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createSellerProduct(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create product",
      );
    }
  },
);

export const fetchSellerSingleProduct = createAsyncThunk(
  "seller/fetchSellerSingleProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await getSellerSingleProduct(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product",
      );
    }
  },
);

export const editSellerProduct = createAsyncThunk(
  "seller/editSellerProduct",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateSellerProduct(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update product",
      );
    }
  },
);

export const updateItemFulfillmentStatus = createAsyncThunk(
  "seller/updateItemFulfillmentStatus",
  async ({ itemId, status }, { rejectWithValue }) => {
    try {
      const res = await updateFulfillmentStatus(itemId, status);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update status",
      );
    }
  },
);

export const cancelSellerItem = createAsyncThunk(
  "seller/cancelSellerItem",
  async ({ itemId, reason }, { rejectWithValue }) => {
    try {
      const res = await cancelSellerOrderItemApi(itemId, reason);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to cancel item",
      );
    }
  },
);

export const fetchPublicSellerProfile = createAsyncThunk(
  "seller/fetchPublicSellerProfile",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getPublicSellerProfile(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch seller profile",
      );
    }
  },
);

export const addSellerCoupon = createAsyncThunk(
  "seller/addSellerCoupon",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createSellerCoupon(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create coupon",
      );
    }
  },
);

export const fetchSellerCoupons = createAsyncThunk(
  "seller/fetchSellerCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getSellerCoupons();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch coupons",
      );
    }
  },
);

export const editSellerCoupon = createAsyncThunk(
  "seller/editSellerCoupon",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateSellerCoupon(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update coupon",
      );
    }
  },
);

export const toggleSellerCouponStatus = createAsyncThunk(
  "seller/toggleSellerCouponStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await toggleSellerCoupon(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update coupon",
      );
    }
  },
);

export const removeSellerCoupon = createAsyncThunk(
  "seller/removeSellerCoupon",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteSellerCoupon(id);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete coupon",
      );
    }
  },
);

export const submitSellerRating = createAsyncThunk(
  "seller/submitSellerRating",
  async ({ sellerId, data }, { rejectWithValue }) => {
    try {
      const response = await rateSellerApi(sellerId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit rating",
      );
    }
  },
);

export const fetchMySellerRating = createAsyncThunk(
  "seller/fetchMySellerRating",
  async (sellerId, { rejectWithValue }) => {
    try {
      const response = await getMySellerRatingApi(sellerId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch rating",
      );
    }
  },
);

// INITIAL STATE

const initialState = {
  mySeller: null,
  mySellerChecked: false,

  adminSellers: [],
  adminSellersPagination: {
    currentPage: 1,
    totalPages: 1,
    totalSellers: 0,
  },
  adminSingleSeller: null,

  dashboardStats: null,

  sellerProducts: [],
  sellerProductsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  },
  sellerSingleProduct: null,

  sellerOrders: [],
  sellerOrdersPagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  },
  sellerOrderDetail: null,

  publicSellerProfile: null,

  sellerCoupons: [],

  myRating: null,

  loading: false,
  error: null,
};

// SLICE

const sellerSlice = createSlice({
  name: "seller",
  initialState,
  reducers: {
    clearSellerError: (state) => {
      state.error = null;
    },
    clearAdminSingleSeller: (state) => {
      state.adminSingleSeller = null;
    },
    clearSellerOrderDetail: (state) => {
      state.sellerOrderDetail = null;
    },
    clearSellerSingleProduct: (state) => {
      state.sellerSingleProduct = null;
    },
    clearPublicSellerProfile: (state) => {
      state.publicSellerProfile = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // APPLY
      .addCase(applyForSeller.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForSeller.fulfilled, (state, action) => {
        state.loading = false;
        state.mySeller = action.payload.seller;
        state.mySellerChecked = true;
      })
      .addCase(applyForSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // MY SELLER PROFILE
      .addCase(fetchMySellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMySellerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.mySeller = action.payload.seller;
        state.mySellerChecked = true;
      })
      .addCase(fetchMySellerProfile.rejected, (state, action) => {
        state.loading = false;
        state.mySellerChecked = true;
        state.error = action.payload;
      })

      // ADMIN — LIST
      .addCase(fetchAdminSellers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminSellers.fulfilled, (state, action) => {
        state.loading = false;
        state.adminSellers = action.payload.sellers || [];
        state.adminSellersPagination.totalSellers =
          action.payload.totalSellers || 0;
        state.adminSellersPagination.totalPages = Math.ceil(
          (action.payload.totalSellers || 0) / 10,
        );
        state.adminSellersPagination.currentPage =
          action.payload.currentPage || 1;
      })
      .addCase(fetchAdminSellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ADMIN — SINGLE
      .addCase(fetchAdminSingleSeller.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.adminSingleSeller = null;
      })
      .addCase(fetchAdminSingleSeller.fulfilled, (state, action) => {
        state.loading = false;
        state.adminSingleSeller = action.payload.seller;
      })
      .addCase(fetchAdminSingleSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ADMIN — APPROVE / REJECT / SUSPEND (all update the same two lists)
      .addCase(approveSeller.fulfilled, (state, action) => {
        const updated = action.payload.seller;
        const index = state.adminSellers.findIndex((s) => s.id === updated.id);
        if (index !== -1)
          state.adminSellers[index] = {
            ...state.adminSellers[index],
            ...updated,
          };
        if (state.adminSingleSeller?.id === updated.id) {
          state.adminSingleSeller = { ...state.adminSingleSeller, ...updated };
        }
      })
      .addCase(approveSeller.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(rejectSeller.fulfilled, (state, action) => {
        const updated = action.payload.seller;
        const index = state.adminSellers.findIndex((s) => s.id === updated.id);
        if (index !== -1)
          state.adminSellers[index] = {
            ...state.adminSellers[index],
            ...updated,
          };
        if (state.adminSingleSeller?.id === updated.id) {
          state.adminSingleSeller = { ...state.adminSingleSeller, ...updated };
        }
      })
      .addCase(rejectSeller.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(suspendSeller.fulfilled, (state, action) => {
        const updated = action.payload.seller;
        const index = state.adminSellers.findIndex((s) => s.id === updated.id);
        if (index !== -1)
          state.adminSellers[index] = {
            ...state.adminSellers[index],
            ...updated,
          };
        if (state.adminSingleSeller?.id === updated.id) {
          state.adminSingleSeller = { ...state.adminSingleSeller, ...updated };
        }
      })
      .addCase(suspendSeller.rejected, (state, action) => {
        state.error = action.payload;
      })

      // DASHBOARD STATS
      .addCase(fetchSellerDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        const { success, ...stats } = action.payload;
        state.dashboardStats = stats;
      })
      .addCase(fetchSellerDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SELLER PRODUCTS
      .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerProducts = action.payload.products || [];
        state.sellerProductsPagination.totalProducts =
          action.payload.totalProducts || 0;
        state.sellerProductsPagination.totalPages = Math.ceil(
          (action.payload.totalProducts || 0) / 10,
        );
        state.sellerProductsPagination.currentPage =
          action.payload.currentPage || 1;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleSellerProductStatus.fulfilled, (state, action) => {
        const updated = action.payload.product;
        const index = state.sellerProducts.findIndex(
          (p) => p.id === updated.id,
        );
        if (index !== -1) state.sellerProducts[index] = updated;
      })
      .addCase(toggleSellerProductStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(addSellerProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSellerProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerProducts.unshift(action.payload.product);
        state.sellerProductsPagination.totalProducts += 1;
      })
      .addCase(addSellerProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSellerSingleProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.sellerSingleProduct = null;
      })
      .addCase(fetchSellerSingleProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerSingleProduct = action.payload.product;
      })
      .addCase(fetchSellerSingleProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editSellerProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editSellerProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.updatedProduct;
        const index = state.sellerProducts.findIndex(
          (p) => p.id === updated.id,
        );
        if (index !== -1) state.sellerProducts[index] = updated;
        state.sellerSingleProduct = updated;
      })
      .addCase(editSellerProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SELLER ORDERS
      .addCase(fetchSellerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerOrders = action.payload.orders || [];
        state.sellerOrdersPagination.totalOrders =
          action.payload.totalOrders || 0;
        state.sellerOrdersPagination.totalPages = Math.ceil(
          (action.payload.totalOrders || 0) / 10,
        );
        state.sellerOrdersPagination.currentPage =
          action.payload.currentPage || 1;
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SELLER ORDER DETAIL
      .addCase(fetchSellerOrderDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.sellerOrderDetail = null;
      })
      .addCase(fetchSellerOrderDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerOrderDetail = action.payload.order;
      })
      .addCase(fetchSellerOrderDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FULFILLMENT STATUS UPDATE
      .addCase(updateItemFulfillmentStatus.fulfilled, (state, action) => {
        const updated = action.payload.item;
        if (state.sellerOrderDetail?.items) {
          const index = state.sellerOrderDetail.items.findIndex(
            (i) => i.id === updated.id,
          );
          if (index !== -1) state.sellerOrderDetail.items[index] = updated;
        }
      })
      .addCase(updateItemFulfillmentStatus.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(cancelSellerItem.fulfilled, (state, action) => {
        const updated = action.payload.item;
        if (state.sellerOrderDetail?.items) {
          const index = state.sellerOrderDetail.items.findIndex(
            (i) => i.id === updated.id,
          );
          if (index !== -1) state.sellerOrderDetail.items[index] = updated;
        }
      })
      .addCase(cancelSellerItem.rejected, (state, action) => {
        state.error = action.payload;
      })

      // FETCH PUBLIC SELLER PROFILE
      .addCase(fetchPublicSellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.publicSellerProfile = null;
      })
      .addCase(fetchPublicSellerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.publicSellerProfile = action.payload.seller;
      })
      .addCase(fetchPublicSellerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SELLER COUPONS
      .addCase(fetchSellerCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerCoupons = action.payload.coupons || [];
      })
      .addCase(fetchSellerCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addSellerCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSellerCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerCoupons.unshift(action.payload.coupon);
      })
      .addCase(addSellerCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editSellerCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editSellerCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.coupon;
        const index = state.sellerCoupons.findIndex((c) => c.id === updated.id);
        if (index !== -1) state.sellerCoupons[index] = updated;
      })
      .addCase(editSellerCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleSellerCouponStatus.fulfilled, (state, action) => {
        const updated = action.payload.coupon;
        const index = state.sellerCoupons.findIndex((c) => c.id === updated.id);
        if (index !== -1) state.sellerCoupons[index] = updated;
      })
      .addCase(toggleSellerCouponStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeSellerCoupon.fulfilled, (state, action) => {
        state.sellerCoupons = state.sellerCoupons.filter(
          (c) => c.id !== action.payload.id,
        );
      })
      .addCase(removeSellerCoupon.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(fetchMySellerRating.fulfilled, (state, action) => {
        state.myRating = action.payload.rating;
      })
      .addCase(fetchMySellerRating.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(submitSellerRating.fulfilled, (state, action) => {
        state.myRating = action.payload.rating;
      })
      .addCase(submitSellerRating.rejected, (state, action) => {
        state.error = action.payload;
      });
  }, 
});

export const {
  clearSellerError,
  clearAdminSingleSeller,
  clearSellerOrderDetail,
  clearSellerSingleProduct,
  clearPublicSellerProfile,
} = sellerSlice.actions;

export default sellerSlice.reducer;
