import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAdminContactMessages, deleteAdminContactMessage } from "../../api/contactApi";

export const fetchAdminContactMessages = createAsyncThunk(
  "contact/fetchAdminContactMessages",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getAdminContactMessages(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch messages");
    }
  },
);

export const removeAdminContactMessage = createAsyncThunk(
  "contact/removeAdminContactMessage",
  async (id, { rejectWithValue }) => {
    try {
      await deleteAdminContactMessage(id);
      return { id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete message");
    }
  },
);

const initialState = {
  adminMessages: [],
  adminPagination: {
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
  },
  loading: false,
  error: null,
};

const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    clearContactError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminContactMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminContactMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.adminMessages = action.payload.messages || [];
        state.adminPagination.totalMessages = action.payload.totalMessages || 0;
        state.adminPagination.totalPages = Math.ceil((action.payload.totalMessages || 0) / 10);
        state.adminPagination.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchAdminContactMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeAdminContactMessage.fulfilled, (state, action) => {
        state.adminMessages = state.adminMessages.filter((m) => m.id !== action.payload.id);
      })
      .addCase(removeAdminContactMessage.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearContactError } = contactSlice.actions;
export default contactSlice.reducer;