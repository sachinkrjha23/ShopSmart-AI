import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrder as createOrderApi,
  getSingleOrder,
  getMyOrders,
  cancelOrder as cancelOrderApi,
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

const initialState = {
  orders: [],
  singleOrder: null,
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
  },
});

export const { clearOrderError, clearSingleOrder } = orderSlice.actions;
export default orderSlice.reducer;
