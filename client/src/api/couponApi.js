import axiosInstance from '../lib/axios'

export const applyCouponCode = (data) => axiosInstance.post('/api/v1/coupon/validate', data)

export const getAdminCoupons = () =>
  axiosInstance.get('/api/v1/coupon/admin/all')

export const createAdminCoupon = (data) =>
  axiosInstance.post('/api/v1/coupon/admin/create', data)

export const updateAdminCoupon = (id, data) =>
  axiosInstance.put(`/api/v1/coupon/admin/update/${id}`, data)

export const toggleAdminCoupon = (id) =>
  axiosInstance.put(`/api/v1/coupon/admin/toggle/${id}`)

export const deleteAdminCoupon = (id) =>
  axiosInstance.delete(`/api/v1/coupon/admin/delete/${id}`)