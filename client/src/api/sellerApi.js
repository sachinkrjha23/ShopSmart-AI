import axiosInstance from '../lib/axios'

export const applyToBecomeSeller = (data) =>
  axiosInstance.post('/api/v1/seller/apply', data)

export const getMySellerProfile = () =>
  axiosInstance.get('/api/v1/seller/me')

export const getAdminSellers = (params) =>
  axiosInstance.get('/api/v1/seller/admin/all', { params })

export const getAdminSingleSeller = (id) =>
  axiosInstance.get(`/api/v1/seller/admin/${id}`)

export const adminApproveSeller = (id) =>
  axiosInstance.put(`/api/v1/seller/admin/approve/${id}`)

export const adminRejectSeller = (id, reason) =>
  axiosInstance.put(`/api/v1/seller/admin/reject/${id}`, { reason })

export const adminSuspendSeller = (id, reason) =>
  axiosInstance.put(`/api/v1/seller/admin/suspend/${id}`, { reason })

export const getSellerDashboardStats = () =>
  axiosInstance.get('/api/v1/seller/dashboard')

export const getSellerProducts = (params) =>
  axiosInstance.get('/api/v1/seller/products', { params })

export const toggleSellerProduct = (productId) =>
  axiosInstance.put(`/api/v1/seller/products/toggle/${productId}`)

export const getSellerOrders = (params) =>
  axiosInstance.get('/api/v1/seller/orders', { params })

export const getSellerOrderDetail = (orderId) =>
  axiosInstance.get(`/api/v1/seller/orders/${orderId}`)

export const createSellerProduct = (data) =>
  axiosInstance.post('/api/v1/seller/products', data)

export const getSellerSingleProduct = (productId) =>
  axiosInstance.get(`/api/v1/seller/products/${productId}`)

export const updateSellerProduct = (productId, data) =>
  axiosInstance.put(`/api/v1/seller/products/${productId}`, data)

export const updateFulfillmentStatus = (itemId, status) =>
  axiosInstance.put(`/api/v1/seller/orders/item/${itemId}/status`, { status })

export const getPublicSellerProfile = (id) =>
  axiosInstance.get(`/api/v1/seller/public/${id}`)

export const cancelSellerOrderItem = (itemId, reason) =>
  axiosInstance.put(`/api/v1/seller/orders/item/${itemId}/cancel`, { reason })

export const createSellerCoupon = (data) =>
  axiosInstance.post('/api/v1/seller/coupons', data)

export const getSellerCoupons = () =>
  axiosInstance.get('/api/v1/seller/coupons')

export const updateSellerCoupon = (id, data) =>
  axiosInstance.put(`/api/v1/seller/coupons/${id}`, data)

export const toggleSellerCoupon = (id) =>
  axiosInstance.put(`/api/v1/seller/coupons/toggle/${id}`)

export const deleteSellerCoupon = (id) =>
  axiosInstance.delete(`/api/v1/seller/coupons/${id}`)