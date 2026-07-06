import axiosInstance from '../lib/axios'

export const createOrder = (data) => axiosInstance.post('/api/v1/payment/create-order', data)
export const verifyPayment = (data) => axiosInstance.post('/api/v1/payment/verify', data)
export const getMyOrders = () => axiosInstance.get('/api/v1/payment/my-orders')
export const getSingleOrder = (orderId) => axiosInstance.get(`/api/v1/payment/order/${orderId}`)
export const cancelOrder = (orderId) => axiosInstance.delete(`/api/v1/payment/cancel/${orderId}`)