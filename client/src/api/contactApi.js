import axiosInstance from '../lib/axios'

export const sendContactMessage = (data) => axiosInstance.post('/api/v1/contact', data)

export const getAdminContactMessages = (params) =>
  axiosInstance.get('/api/v1/contact/admin/all', { params })

export const deleteAdminContactMessage = (id) =>
  axiosInstance.delete(`/api/v1/contact/admin/${id}`)