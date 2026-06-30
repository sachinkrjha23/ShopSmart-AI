import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  coupon: null,
  discount: 0,
  loading: false,
  error: null,
}

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {},
})

export default couponSlice.reducer