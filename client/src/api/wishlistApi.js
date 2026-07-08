import axiosInstance from '../lib/axios'

export const getWishlist = () => axiosInstance.get('/api/v1/wishlist')
export const addToWishlist = (productId) => axiosInstance.post(`/api/v1/wishlist/add/${productId}`)
export const removeFromWishlist = (productId) => axiosInstance.delete(`/api/v1/wishlist/remove/${productId}`)
export const clearWishlist = () => axiosInstance.delete('/api/v1/wishlist/clear')
export const checkWishlist = (productId) => axiosInstance.get(`/api/v1/wishlist/check/${productId}`)