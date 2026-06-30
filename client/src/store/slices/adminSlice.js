import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  stats: {
    todayRevenue: 0,
    yesterdayRevenue: 0,
    lastMonthRevenue: 0,
    totalRevenue: 0,
    totalSales: 0,
  },
  orders: [],
  users: [],
  loading: false,
  error: null,
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
})

export default adminSlice.reducer