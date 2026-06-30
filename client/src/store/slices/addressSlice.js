import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  addresses: [],
  selectedAddress: null,
  loading: false,
  error: null,
}

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {},
})

export default addressSlice.reducer