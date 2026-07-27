import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getDashboardStats,
  getAllUsers,
  deleteUser as deleteUserApi,
  getActivityLog as getActivityLogApi,
} from "../../api/adminApi";

export const fetchDashboardStats = createAsyncThunk(
  "admin/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getDashboardStats();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch dashboard stats",
      );
    }
  },
);

export const fetchAllUsers = createAsyncThunk(
  "admin/fetchAllUsers",
  async ({ page = 1, role = 'User' } = {}, { rejectWithValue }) => {
    try {
      const res = await getAllUsers(page, role);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

export const fetchActivityLog = createAsyncThunk(
  "admin/fetchActivityLog",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getActivityLogApi(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch activity log",
      );
    }
  },
);

export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async ({ id, adminSecret }, { rejectWithValue }) => {
    try {
      await deleteUserApi(id, adminSecret);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

const initialState = {
  stats: null,
  users: [],
  totalUsers: 0,
  currentPage: 1,
  activityLogs: [],
  totalActivityLogs: 0,
  activityLogPage: 1,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.totalUsers = action.payload.totalUsers;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchActivityLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLog.fulfilled, (state, action) => {
        state.loading = false;
        state.activityLogs = action.payload.logs;
        state.totalActivityLogs = action.payload.totalLogs;
        state.activityLogPage = action.payload.currentPage;
      })
      .addCase(fetchActivityLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
        state.totalUsers -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
