import axiosInstance from '../lib/axios'

export const getProducts = (params) => 
  axiosInstance.get('/api/v1/product', { params })

export const getProduct = (id) => 
  axiosInstance.get(`/api/v1/product/singleProduct/${id}`)

export const createProduct = (data) => 
  axiosInstance.post('/api/v1/product/admin/create', data)

export const updateProduct = (id, data) => 
  axiosInstance.put(`/api/v1/product/admin/update/${id}`, data)

export const deleteProduct = (id) => 
  axiosInstance.delete(`/api/v1/product/admin/delete/${id}`)

export const postReview = (productId, data) => 
  axiosInstance.put(`/api/v1/product/post-new/review/${productId}`, data)

export const deleteReview = (productId) => 
  axiosInstance.delete(`/api/v1/product/delete/review/${productId}`)

export const getAIRecommendations = (prompt) => 
  axiosInstance.post('/api/v1/product/ai/recommend', { userPrompt: prompt })

export const getCategories = () =>
  axiosInstance.get('/api/v1/product/categories')

export const getTopReviews = () =>
  axiosInstance.get('/api/v1/product/reviews/top')

export const getAdminProducts = (params) => 
  axiosInstance.get('/api/v1/product/admin/all', { params })

export const getAdminSingleProduct = (id) => 
  axiosInstance.get(`/api/v1/product/admin/single/${id}`)

export const getAdminReviews = (params) =>
  axiosInstance.get('/api/v1/product/admin/reviews', { params })

export const deleteAdminReview = (reviewId) =>
  axiosInstance.delete(`/api/v1/product/admin/reviews/${reviewId}`)

export const checkProductsAvailability = (productIds) =>
  axiosInstance.post('/api/v1/product/check-availability', { productIds })