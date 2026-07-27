import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  requestReturn as requestReturnApi,
  getAdminReturns,
  resolveAdminReturn as resolveAdminReturnApi,
  getSellerReturns,
  resolveSellerReturn as resolveSellerReturnApi,
  retryAdminReturnRefund as retryAdminReturnRefundApi,
  retrySellerReturnRefund as retrySellerReturnRefundApi,
} from "../../api/returnApi";

export const requestReturn = createAsyncThunk(
  "returns/requestReturn",
  async ({ orderItemId, reason }, { rejectWithValue }) => {
    try {
      const res = await requestReturnApi(orderItemId, reason);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to submit return request",
      );
    }
  },
);

export const fetchAdminReturns = createAsyncThunk(
  "returns/fetchAdminReturns",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getAdminReturns(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch return requests",
      );
    }
  },
);

export const resolveAdminReturn = createAsyncThunk(
  "returns/resolveAdminReturn",
  async ({ returnId, action, admin_notes }, { rejectWithValue }) => {
    try {
      const res = await resolveAdminReturnApi(returnId, { action, admin_notes });
      return { ...res.data, returnId, action };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to resolve return request",
      );
    }
  },
);

export const fetchSellerReturns = createAsyncThunk(
  "returns/fetchSellerReturns",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getSellerReturns(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch return requests",
      );
    }
  },
);

export const resolveSellerReturn = createAsyncThunk(
  "returns/resolveSellerReturn",
  async ({ returnId, action, admin_notes }, { rejectWithValue }) => {
    try {
      const res = await resolveSellerReturnApi(returnId, { action, admin_notes });
      return { ...res.data, returnId, action };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to resolve return request",
      );
    }
  },
);

export const retryAdminRefund = createAsyncThunk(
  "returns/retryAdminRefund",
  async (returnId, { rejectWithValue }) => {
    try {
      const res = await retryAdminReturnRefundApi(returnId);
      return { ...res.data, returnId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to issue refund",
      );
    }
  },
);

export const retrySellerRefund = createAsyncThunk(
  "returns/retrySellerRefund",
  async (returnId, { rejectWithValue }) => {
    try {
      const res = await retrySellerReturnRefundApi(returnId);
      return { ...res.data, returnId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to issue refund",
      );
    }
  },
);

const initialState = {
  loading: false,
  error: null,
  adminReturns: [],
  adminReturnsLoading: false,
  sellerReturns: [],
  sellerReturnsLoading: false,
};

const returnSlice = createSlice({
  name: "returns",
  initialState,
  reducers: {
    clearReturnError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestReturn.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchAdminReturns.pending, (state) => {
        state.adminReturnsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminReturns.fulfilled, (state, action) => {
        state.adminReturnsLoading = false;
        state.adminReturns = action.payload.returnRequests;
      })
      .addCase(fetchAdminReturns.rejected, (state, action) => {
        state.adminReturnsLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(resolveAdminReturn.fulfilled, (state, action) => {
        const { returnId, action: resolvedAction, refundAmount } = action.payload;
        state.adminReturns = state.adminReturns.map((rr) =>
          rr.id === returnId
            ? {
                ...rr,
                status: resolvedAction === "Approve" ? "Approved" : "Rejected",
                refund_amount: refundAmount ?? rr.refund_amount,
              }
            : rr,
        );
      })
      .addCase(resolveAdminReturn.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(fetchSellerReturns.pending, (state) => {
        state.sellerReturnsLoading = true;
        state.error = null;
      })
      .addCase(fetchSellerReturns.fulfilled, (state, action) => {
        state.sellerReturnsLoading = false;
        state.sellerReturns = action.payload.returnRequests;
      })
      .addCase(fetchSellerReturns.rejected, (state, action) => {
        state.sellerReturnsLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(resolveSellerReturn.fulfilled, (state, action) => {
        const { returnId, action: resolvedAction, refundAmount } = action.payload;
        state.sellerReturns = state.sellerReturns.map((rr) =>
          rr.id === returnId
            ? {
                ...rr,
                status: resolvedAction === "Approve" ? "Approved" : "Rejected",
                refund_amount: refundAmount ?? rr.refund_amount,
              }
            : rr,
        );
      })
      .addCase(resolveSellerReturn.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(retryAdminRefund.fulfilled, (state, action) => {
        const { returnId, refundAmount } = action.payload;
        state.adminReturns = state.adminReturns.map((rr) =>
          rr.id === returnId ? { ...rr, refund_amount: refundAmount } : rr,
        );
      })
      .addCase(retryAdminRefund.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(retrySellerRefund.fulfilled, (state, action) => {
        const { returnId, refundAmount } = action.payload;
        state.sellerReturns = state.sellerReturns.map((rr) =>
          rr.id === returnId ? { ...rr, refund_amount: refundAmount } : rr,
        );
      })
      .addCase(retrySellerRefund.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearReturnError } = returnSlice.actions;
export default returnSlice.reducer;