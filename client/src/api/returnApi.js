import axiosInstance from '../lib/axios'

export const requestReturn = (orderItemId, reason) =>
  axiosInstance.post('/api/v1/return/request', { orderItemId, reason })

export const getAdminReturns = (params) =>
  axiosInstance.get('/api/v1/return/admin', { params })

export const resolveAdminReturn = (returnId, data) =>
  axiosInstance.patch(`/api/v1/return/admin/${returnId}`, data)

export const getSellerReturns = (params) =>
  axiosInstance.get('/api/v1/return/seller', { params })

export const resolveSellerReturn = (returnId, data) =>
  axiosInstance.patch(`/api/v1/return/seller/${returnId}`, data)