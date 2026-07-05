import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getAddresses,
  createAddress,
  updateAddressById,
  setDefaultAddressById,
  deleteAddressById,
} from '../../api/addressApi'

export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAddresses()
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch addresses')
    }
  },
)

export const addAddress = createAsyncThunk(
  'address/addAddress',
  async (data, { rejectWithValue }) => {
    try {
      const res = await createAddress(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add address')
    }
  },
)

export const editAddress = createAsyncThunk(
  'address/editAddress',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateAddressById(id, data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update address')
    }
  },
)

export const setDefaultAddress = createAsyncThunk(
  'address/setDefaultAddress',
  async (id, { rejectWithValue }) => {
    try {
      const res = await setDefaultAddressById(id)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to set default address')
    }
  },
)

export const removeAddress = createAsyncThunk(
  'address/removeAddress',
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteAddressById(id)
      return { ...res.data, id }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete address')
    }
  },
)

const initialState = {
  addresses: [],
  selectedAddress: null,
  loading: false,
  error: null,
}

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    selectAddress: (state, action) => {
      state.selectedAddress = action.payload
    },
    clearAddressError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false
        state.addresses = action.payload.addresses

        // Auto-select the default address if nothing is selected yet

        if (!state.selectedAddress) {
          state.selectedAddress = action.payload.addresses.find((a) => a.is_default) || action.payload.addresses[0] || null
        }
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(addAddress.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false
        const newAddress = action.payload.address

        if (newAddress.is_default) {
          state.addresses = state.addresses.map((a) => ({ ...a, is_default: false }))
        }
        state.addresses.push(newAddress)
        state.selectedAddress = newAddress
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(editAddress.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(editAddress.fulfilled, (state, action) => {
        state.loading = false
        const updated = action.payload.address
        if (updated.is_default) {
          state.addresses = state.addresses.map((a) => ({ ...a, is_default: false }))
        }
        state.addresses = state.addresses.map((a) => (a.id === updated.id ? updated : a))
        if (state.selectedAddress?.id === updated.id) {
          state.selectedAddress = updated
        }
      })
      .addCase(editAddress.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        const updated = action.payload.address
        state.addresses = state.addresses.map((a) => ({
          ...a,
          is_default: a.id === updated.id,
        }))
      })

      .addCase(removeAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter((a) => a.id !== action.payload.id)
        if (state.selectedAddress?.id === action.payload.id) {
          state.selectedAddress = state.addresses.find((a) => a.is_default) || state.addresses[0] || null
        }
      })
      .addCase(removeAddress.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { selectAddress, clearAddressError } = addressSlice.actions
export default addressSlice.reducer