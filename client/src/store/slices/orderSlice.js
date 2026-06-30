import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  orders: [],
  singleOrder: null,
  loading: false,
  error: null,
}

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {},
})

export default orderSlice.reducer