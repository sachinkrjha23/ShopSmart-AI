import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { logout } from "./authSlice";
import {
  getWishlist,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
  clearWishlist as clearWishlistApi,
} from "../../api/wishlistApi";

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getWishlist();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch wishlist",
      );
    }
  },
);

export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async (productId, { dispatch, rejectWithValue }) => {
    try {
      const res = await addToWishlistApi(productId);
      await dispatch(fetchWishlist());
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to add to wishlist",
      );
    }
  },
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const res = await removeFromWishlistApi(productId);
      return { productId, ...res.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to remove from wishlist",
      );
    }
  },
);

export const clearWishlist = createAsyncThunk(
  "wishlist/clearWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const res = await clearWishlistApi();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to clear wishlist",
      );
    }
  },
);

const initialState = {
  items: [],
  wishlistCount: 0,
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.wishlist;
        state.wishlistCount = action.payload.wishlistCount;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.product_id !== action.payload.productId,
        );
        state.wishlistCount = action.payload.wishlistCount;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(clearWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.wishlistCount = 0;
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder.addCase(logout.fulfilled, (state) => {
      state.items = [];
      state.wishlistCount = 0;
    });
  },
});

export const { clearWishlistError } = wishlistSlice.actions;
export default wishlistSlice.reducer;
