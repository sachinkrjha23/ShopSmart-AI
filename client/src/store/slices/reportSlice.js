import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  submitReport as submitReportApi,
  getAdminReports as getAdminReportsApi,
  resolveReport as resolveReportApi,
} from "../../api/reportApi";

export const submitReport = createAsyncThunk(
  "report/submitReport",
  async (data, { rejectWithValue }) => {
    try {
      const res = await submitReportApi(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to submit report",
      );
    }
  },
);

export const fetchAdminReports = createAsyncThunk(
  "report/fetchAdminReports",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getAdminReportsApi(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch reports",
      );
    }
  },
);

export const resolveReportThunk = createAsyncThunk(
  "report/resolveReport",
  async ({ reportId, status, resolutionNotes }, { rejectWithValue }) => {
    try {
      const res = await resolveReportApi(reportId, { status, resolutionNotes });
      return res.data.report;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to resolve report",
      );
    }
  },
);

const initialState = {
  submitting: false,
  adminReports: [],
  totalReports: 0,
  currentPage: 1,
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    clearReportError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitReport.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitReport.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(submitReport.rejected, (state) => {
        state.submitting = false;
      });

    builder
      .addCase(fetchAdminReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReports.fulfilled, (state, action) => {
        state.loading = false;
        state.adminReports = action.payload.reports;
        state.totalReports = action.payload.totalReports;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAdminReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(resolveReportThunk.fulfilled, (state, action) => {
        state.adminReports = state.adminReports.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r,
        );
      });
  },
});

export const { clearReportError } = reportSlice.actions;
export default reportSlice.reducer;