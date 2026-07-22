import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMyNotifications,
  markNotificationReadApi,
  dismissNotificationApi,
  createBroadcastNotification as createBroadcastNotificationApi,
} from "../../api/notificationApi";

// Always unread-only — feeds the bell icon's badge + dropdown.
export const fetchBellNotifications = createAsyncThunk(
  "notification/fetchBellNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyNotifications({});
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notifications",
      );
    }
  },
);

// Respects the Unread/All toggle — feeds the full /notifications page.
export const fetchInboxNotifications = createAsyncThunk(
  "notification/fetchInboxNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getMyNotifications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notifications",
      );
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  "notification/markNotificationRead",
  async (id, { rejectWithValue }) => {
    try {
      await markNotificationReadApi(id);
      return { id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notification as read",
      );
    }
  },
);

export const dismissNotification = createAsyncThunk(
  "notification/dismissNotification",
  async (id, { rejectWithValue }) => {
    try {
      await dismissNotificationApi(id);
      return { id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to dismiss notification",
      );
    }
  },
);

export const createBroadcast = createAsyncThunk(
  "notification/createBroadcast",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createBroadcastNotificationApi(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create broadcast",
      );
    }
  },
);

const initialState = {
  bellNotifications: [],
  unreadCount: 0,
  inboxNotifications: [],
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBellNotifications.fulfilled, (state, action) => {
        state.bellNotifications = action.payload.notifications || [];
        state.unreadCount = action.payload.count || 0;
      })
      .addCase(fetchBellNotifications.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(fetchInboxNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInboxNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.inboxNotifications = action.payload.notifications || [];
      })
      .addCase(fetchInboxNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const { id } = action.payload;
        const bellItem = state.bellNotifications.find((n) => n.id === id);
        const inboxItem = state.inboxNotifications.find((n) => n.id === id);
        const wasUnread = (bellItem && !bellItem.read_at) || (inboxItem && !inboxItem.read_at);

        state.bellNotifications = state.bellNotifications.filter((n) => n.id !== id);
        if (inboxItem) inboxItem.read_at = new Date().toISOString();
        if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(dismissNotification.fulfilled, (state, action) => {
        const { id } = action.payload;
        const bellItem = state.bellNotifications.find((n) => n.id === id);
        const wasUnread = bellItem && !bellItem.read_at;

        state.bellNotifications = state.bellNotifications.filter((n) => n.id !== id);
        state.inboxNotifications = state.inboxNotifications.filter((n) => n.id !== id);
        if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(dismissNotification.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(createBroadcast.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;