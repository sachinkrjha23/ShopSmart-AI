import axiosInstance from '../lib/axios'

export const registerUser = (data) => axiosInstance.post('/api/v1/auth/register', data)

export const loginUser = (data) => axiosInstance.post('/api/v1/auth/login', data)

export const logoutUser = () => axiosInstance.get('/api/v1/auth/logout')

export const getMe = () => axiosInstance.get('/api/v1/auth/me')

export const updateProfile = (data) => axiosInstance.put('/api/v1/auth/profile/update', data)

export const updatePassword = (data) => axiosInstance.put('/api/v1/auth/password/update', data)

export const forgotPassword = (data) =>
  axiosInstance.post(`/api/v1/auth/password/forgot?frontendUrl=${window.location.origin}`, data)

export const resetPassword = (token, data) =>
  axiosInstance.put(`/api/v1/auth/password/reset/${token}`, data)