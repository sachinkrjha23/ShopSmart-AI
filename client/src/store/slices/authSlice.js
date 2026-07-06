import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
  updatePassword,
  googleLoginUser,
  googleSignupUser,
  verifyEmailToken,
  resendVerificationEmail,
} from "../../api/authApi";

export const register = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await registerUser(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed",
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await loginUser(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  },
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (data, { rejectWithValue }) => {
    try {
      const res = await googleLoginUser(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Google login failed",
      );
    }
  },
);

export const googleSignup = createAsyncThunk(
  "auth/googleSignup",
  async (data, { rejectWithValue }) => {
    try {
      const res = await googleSignupUser(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Google signup failed",
      );
    }
  },
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (token, { rejectWithValue }) => {
    try {
      const res = await verifyEmailToken(token);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Email verification failed",
      );
    }
  },
);

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (data, { rejectWithValue }) => {
    try {
      const res = await resendVerificationEmail(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to resend verification email",
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await logoutUser();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  },
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMe();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch user",
      );
    }
  },
);

export const editProfile = createAsyncThunk(
  "auth/editProfile",
  async (data, { rejectWithValue }) => {
    try {
      const res = await updateProfile(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Profile update failed",
      );
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await updatePassword(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Password update failed",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    registrationMessage: null,
    sessionChecked: false, 
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRegistrationMessage: (state) => {
      state.registrationMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registrationMessage = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.registrationMessage = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(googleSignup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleSignup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(googleSignup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state, action) => {
        state.loading = false;
        state.registrationMessage = action.payload.message;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });

    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.sessionChecked = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.sessionChecked = true;
      });

    builder
      .addCase(editProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(editProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearRegistrationMessage } = authSlice.actions;
export default authSlice.reducer;
