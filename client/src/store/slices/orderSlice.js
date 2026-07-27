import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrder as createOrderApi,
  getSingleOrder,
  getMyOrders,
  cancelOrder as cancelOrderApi,
  getAdminAllOrders,
  getAdminSingleOrder,
  updateOrderStatus as updateOrderStatusApi,
  adminCancelOrder as adminCancelOrderApi,
  updateAdminItemFulfillmentStatus as updateAdminItemFulfillmentStatusApi,
  adminRefundOrder as adminRefundOrderApi,
} from "../../api/orderApi";

export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createOrderApi(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create order",
      );
    }
  },
);

export const fetchMyOrders = createAsyncThunk(
  "order/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMyOrders();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch orders",
      );
    }
  },
);

export const fetchSingleOrder = createAsyncThunk(
  "order/fetchSingleOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await getSingleOrder(orderId);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch order",
      );
    }
  },
);

export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await cancelOrderApi(orderId);
      return { ...res.data, orderId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to cancel order",
      );
    }
  },
);

export const cancelAdminOrder = createAsyncThunk(
  "order/cancelAdminOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await adminCancelOrderApi(orderId);
      return { ...res.data, orderId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to cancel order",
      );
    }
  },
);

export const fetchAdminOrders = createAsyncThunk(
  "order/fetchAdminOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getAdminAllOrders(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch orders",
      );
    }
  },
);

export const fetchAdminSingleOrder = createAsyncThunk(
  "order/fetchAdminSingleOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await getAdminSingleOrder(orderId);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch order",
      );
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "order/updateOrderStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await updateOrderStatusApi(orderId, status);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update order status",
      );
    }
  },
);

export const updateAdminItemFulfillmentStatus = createAsyncThunk(
  "order/updateAdminItemFulfillmentStatus",
  async ({ itemId, status }, { rejectWithValue }) => {
    try {
      const res = await updateAdminItemFulfillmentStatusApi(itemId, status);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update item status",
      );
    }
  },
);

export const refundAdminOrder = createAsyncThunk(
  "order/refundAdminOrder",
  async ({ orderId, amount }, { rejectWithValue }) => {
    try {
      const res = await adminRefundOrderApi(orderId, amount);
      return { ...res.data, orderId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to issue refund",
      );
    }
  },
);

const initialState = {
  orders: [],
  singleOrder: null,
  adminOrders: [],
  adminPagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  },
  adminFilters: {
    status: "",
    search: "",
  },
  adminSingleOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearSingleOrder: (state) => {
      state.singleOrder = null;
    },
    clearAdminSingleOrder: (state) => {
      state.adminSingleOrder = null;
    },
    setAdminOrderFilters: (state, action) => {
      state.adminFilters = { ...state.adminFilters, ...action.payload };
      state.adminPagination.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchSingleOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSingleOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.singleOrder = action.payload.order;
      })
      .addCase(fetchSingleOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const { orderId } = action.payload;
        state.orders = state.orders.map((order) =>
          order.id === orderId
            ? { ...order, order_status: "Cancelled" }
            : order,
        );
        if (state.singleOrder?.id === orderId) {
          state.singleOrder = {
            ...state.singleOrder,
            order_status: "Cancelled",
          };
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.adminOrders = action.payload.orders || [];
        state.adminPagination.totalOrders = action.payload.totalOrders || 0;
        state.adminPagination.totalPages = Math.ceil(
          (action.payload.totalOrders || 0) / 10,
        );
        state.adminPagination.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchAdminSingleOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.adminSingleOrder = null;
      })
      .addCase(fetchAdminSingleOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.adminSingleOrder = action.payload.order;
      })
      .addCase(fetchAdminSingleOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.order;
        const index = state.adminOrders.findIndex((o) => o.id === updated.id);
        if (index !== -1) {
          state.adminOrders[index] = {
            ...state.adminOrders[index],
            order_status: updated.order_status,
          };
        }
        if (state.adminSingleOrder?.id === updated.id) {
          state.adminSingleOrder = {
            ...state.adminSingleOrder,
            order_status: updated.order_status,
          };
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateAdminItemFulfillmentStatus.fulfilled, (state, action) => {
        const updatedItem = action.payload.item;
        if (state.adminSingleOrder?.items) {
          const itemIndex = state.adminSingleOrder.items.findIndex(
            (i) => i.itemId === updatedItem.id,
          );
          if (itemIndex !== -1) {
            state.adminSingleOrder.items[itemIndex].fulfillmentStatus = updatedItem.fulfillment_status;
          }
        }
      })
      .addCase(updateAdminItemFulfillmentStatus.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(cancelAdminOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelAdminOrder.fulfilled, (state, action) => {
        state.loading = false;
        const { orderId } = action.payload;
        const index = state.adminOrders.findIndex((o) => o.id === orderId);
        if (index !== -1) {
          state.adminOrders[index] = {
            ...state.adminOrders[index],
            order_status: "Cancelled",
          };
        }
        if (state.adminSingleOrder?.id === orderId) {
          state.adminSingleOrder = {
            ...state.adminSingleOrder,
            order_status: "Cancelled",
          };
        }
      })
      .addCase(cancelAdminOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearOrderError,
  clearSingleOrder,
  clearAdminSingleOrder,
  setAdminOrderFilters,
} = orderSlice.actions;
export default orderSlice.reducer;
