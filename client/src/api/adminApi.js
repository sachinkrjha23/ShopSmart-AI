import axiosInstance from '../lib/axios'

export const getDashboardStats = () => axiosInstance.get('/api/v1/admin/fetch/dashboard-stats')
export const getAllUsers = (page = 1) => axiosInstance.get(`/api/v1/admin/getallusers?page=${page}`)
export const deleteUser = (id) => axiosInstance.delete(`/api/v1/admin/delete/${id}`)