import axiosInstance from '../lib/axios'

export const registerUser = (data) =>
  axiosInstance.post(`/api/v1/auth/register?frontendUrl=${window.location.origin}`, data)

export const verifyEmailToken = (token) => axiosInstance.get(`/api/v1/auth/verify-email/${token}`)

export const resendVerificationEmail = (data) =>
  axiosInstance.post(`/api/v1/auth/resend-verification?frontendUrl=${window.location.origin}`, data)

export const loginUser = (data) => axiosInstance.post('/api/v1/auth/login', data)

export const logoutUser = () => axiosInstance.get('/api/v1/auth/logout')

export const getMe = () => axiosInstance.get('/api/v1/auth/me')

export const updateProfile = (data) =>
  axiosInstance.put(`/api/v1/auth/profile/update?frontendUrl=${window.location.origin}`, data)

export const confirmEmailChange = (token) =>
  axiosInstance.get(`/api/v1/auth/email-change/confirm/${token}`)

export const updatePassword = (data) => axiosInstance.put('/api/v1/auth/password/update', data)

export const forgotPassword = (data) =>
  axiosInstance.post(`/api/v1/auth/password/forgot?frontendUrl=${window.location.origin}`, data)

export const resetPassword = (token, data) =>
  axiosInstance.put(`/api/v1/auth/password/reset/${token}`, data)

export const googleLoginUser = (data) => axiosInstance.post('/api/v1/auth/google/login', data)

export const googleSignupUser = (data) => axiosInstance.post('/api/v1/auth/google/signup', data)