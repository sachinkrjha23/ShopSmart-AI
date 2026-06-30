import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isCartDrawerOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openLoginModal: (state) => { state.isLoginModalOpen = true },
    closeLoginModal: (state) => { state.isLoginModalOpen = false },
    openRegisterModal: (state) => { state.isRegisterModalOpen = true },
    closeRegisterModal: (state) => { state.isRegisterModalOpen = false },
    openCartDrawer: (state) => { state.isCartDrawerOpen = true },
    closeCartDrawer: (state) => { state.isCartDrawerOpen = false },
  },
})

export const {
  openLoginModal,
  closeLoginModal,
  openRegisterModal,
  closeRegisterModal,
  openCartDrawer,
  closeCartDrawer,
} = uiSlice.actions

export default uiSlice.reducer