import axiosInstance from '../lib/axios'

export const applyCouponCode = (data) => axiosInstance.post('/api/v1/coupon/validate', data)