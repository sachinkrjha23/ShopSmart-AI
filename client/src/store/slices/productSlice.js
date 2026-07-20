import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  postReview,
  deleteReview,
  getAIRecommendations,
  getCategories,
  getTopReviews,
  getAdminProducts,
  getAdminSingleProduct,
  getAdminReviews,
  deleteAdminReview,
} from "../../api/productApi";

// ASYNC THUNKS

export const fetchProducts = createAsyncThunk(
  "product/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getProducts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products",
      );
    }
  },
);

export const fetchProduct = createAsyncThunk(
  "product/fetchProduct",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getProduct(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product",
      );
    }
  },
);

export const addProduct = createAsyncThunk(
  "product/addProduct",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createProduct(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create product",
      );
    }
  },
);

export const editProduct = createAsyncThunk(
  "product/editProduct",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateProduct(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update product",
      );
    }
  },
);

export const removeProduct = createAsyncThunk(
  'product/removeProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteProduct(id)
      return { id, ...response.data } // backend doesn't return id, so we pass it manually
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product')
    }
  }
)

export const fetchAdminProducts = createAsyncThunk(
  "product/fetchAdminProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminProducts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products",
      );
    }
  },
);

export const fetchAdminSingleProduct = createAsyncThunk(
  "product/fetchAdminSingleProduct",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getAdminSingleProduct(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product",
      );
    }
  },
);

export const fetchAdminReviews = createAsyncThunk(
  "product/fetchAdminReviews",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAdminReviews(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch reviews",
      );
    }
  },
);

export const removeAdminReview = createAsyncThunk(
  "product/removeAdminReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await deleteAdminReview(reviewId);
      return { reviewId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete review",
      );
    }
  },
);

export const submitReview = createAsyncThunk(
  "product/submitReview",
  async ({ productId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await postReview(productId, reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit review",
      );
    }
  },
);

export const removeReview = createAsyncThunk(
  "product/removeReview",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await deleteReview(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete review",
      );
    }
  },
);

export const fetchAIRecommendations = createAsyncThunk(
  "product/fetchAIRecommendations",
  async (prompt, { rejectWithValue }) => {
    try {
      const response = await getAIRecommendations(prompt);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get AI recommendations",
      );
    }
  },
);

export const fetchCategories = createAsyncThunk(
  "product/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories",
      );
    }
  },
);

export const fetchTopReviews = createAsyncThunk(
  "product/fetchTopReviews",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getTopReviews();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch reviews",
      );
    }
  },
);

// INITIAL STATE

const initialState = {
  products: [],
  singleProduct: null,
  newProducts: [],
  topRatedProducts: [],
  aiProducts: [],
  categories: [],
  categoriesLoading: false,
  topReviews: [],
  topReviewsLoading: false,
  currentProductsRequestId: null,
  adminProducts: [],
  adminPagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  },
  adminSingleProduct: null,
  adminReviews: [],
  adminReviewsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
  },

  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  },

  filters: {
    category: "",
    minPrice: "",
    maxPrice: "",
    rating: "",
    sort: "",
    availability: "",
    search: "",
  },

  loading: false,
  error: null,
  aiLoading: false,
};

// SLICE

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    clearProductError: (state) => {
      state.error = null;
    },
    clearSingleProduct: (state) => {
      state.singleProduct = null;
    },
    clearAIProducts: (state) => {
      state.aiProducts = [];
    },
    clearAdminSingleProduct: (state) => {
      state.adminSingleProduct = null;
    },
    clearProducts: (state) => {
      state.products = [];
      state.pagination = { currentPage: 1, totalPages: 1, totalProducts: 0 };
    },
  },

  extraReducers: (builder) => {
    builder
      // FETCH ALL PRODUCTS
      .addCase(fetchProducts.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentProductsRequestId = action.meta.requestId; // ✅ track latest request
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.currentProductsRequestId) return;
        state.loading = false;
        state.products = action.payload.products || [];
        state.newProducts = action.payload.newProducts || [];
        state.topRatedProducts = action.payload.topRatedProducts || [];
        state.pagination.totalProducts = action.payload.totalProducts || 0;
        state.pagination.totalPages = Math.ceil(
          (action.payload.totalProducts || 0) / 10,
        );
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (action.meta.requestId !== state.currentProductsRequestId) return;
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH SINGLE PRODUCT
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.singleProduct = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.singleProduct = action.payload.product;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE PRODUCT — backend returns { product }
      .addCase(addProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload.product);
        state.pagination.totalProducts += 1;
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE PRODUCT — backend returns { updatedProduct } not { product }
      .addCase(editProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.updatedProduct;
        const index = state.products.findIndex((p) => p.id === updated.id);
        if (index !== -1) state.products[index] = updated;
        state.singleProduct = updated;
      })
      .addCase(editProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // TOGGLE PRODUCT ACTIVE STATE — backend now toggles is_active instead of hard-deleting
      .addCase(removeProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeProduct.fulfilled, (state, action) => {
        state.loading = false;
        const { id, product } = action.payload;

        if (product && !product.is_active) {
          // Deactivated — drop from the customer-facing list if it was there
          const wasVisible = state.products.some((p) => p.id === id);
          if (wasVisible) {
            state.products = state.products.filter((p) => p.id !== id);
            state.pagination.totalProducts = Math.max(
              0,
              state.pagination.totalProducts - 1,
            );
          }
        }

        const adminIndex = state.adminProducts.findIndex((p) => p.id === id);
        if (adminIndex !== -1 && product)
          state.adminProducts[adminIndex] = product;
      })
      .addCase(removeProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH ADMIN PRODUCTS
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.adminProducts = action.payload.products || [];
        state.adminPagination.totalProducts = action.payload.totalProducts || 0;
        state.adminPagination.totalPages = Math.ceil(
          (action.payload.totalProducts || 0) / 10,
        );
        state.adminPagination.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH ADMIN SINGLE PRODUCT
      .addCase(fetchAdminSingleProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.adminSingleProduct = null;
      })
      .addCase(fetchAdminSingleProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.adminSingleProduct = action.payload.product;
      })
      .addCase(fetchAdminSingleProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // FETCH ADMIN REVIEW
      .addCase(fetchAdminReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.adminReviews = action.payload.reviews || [];
        state.adminReviewsPagination.totalReviews = action.payload.totalReviews || 0;
        state.adminReviewsPagination.totalPages = Math.ceil(
          (action.payload.totalReviews || 0) / 10,
        );
        state.adminReviewsPagination.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeAdminReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeAdminReview.fulfilled, (state, action) => {
        state.loading = false;
        const { reviewId } = action.payload;
        state.adminReviews = state.adminReviews.filter((r) => r.id !== reviewId);
        state.adminReviewsPagination.totalReviews = Math.max(
          0,
          state.adminReviewsPagination.totalReviews - 1,
        );
      })
      .addCase(removeAdminReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SUBMIT REVIEW — component re-dispatches fetchProduct() after success for fresh reviews
      .addCase(submitReview.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.error = action.payload;
      })

      // REMOVE REVIEW — same pattern
      .addCase(removeReview.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(removeReview.rejected, (state, action) => {
        state.error = action.payload;
      })

      // AI RECOMMENDATIONS
      .addCase(fetchAIRecommendations.pending, (state) => {
        state.aiLoading = true;
        state.error = null;
      })
      .addCase(fetchAIRecommendations.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.aiProducts = action.payload.products || [];
      })
      .addCase(fetchAIRecommendations.rejected, (state, action) => {
        state.aiLoading = false;
        state.error = action.payload;
      })
      // FETCH CATEGORIES
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload.categories || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload;
      })
      // FETCH TOP REVIEWS
      .addCase(fetchTopReviews.pending, (state) => {
        state.topReviewsLoading = true;
      })
      .addCase(fetchTopReviews.fulfilled, (state, action) => {
        state.topReviewsLoading = false;
        state.topReviews = action.payload.reviews || [];
      })
      .addCase(fetchTopReviews.rejected, (state, action) => {
        state.topReviewsLoading = false;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setCurrentPage,
  clearProductError,
  clearSingleProduct,
  clearAIProducts,
  clearAdminSingleProduct,
  clearProducts
} = productSlice.actions;

export default productSlice.reducer;
