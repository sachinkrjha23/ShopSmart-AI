import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  products: [],
  singleProduct: null,
  aiResults: [],
  filters: {
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sort: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  },
  loading: false,
  error: null,
}

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {},
})

export default productSlice.reducer