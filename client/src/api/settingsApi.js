import axiosInstance from '../lib/axios'

export const getSettings = () => axiosInstance.get('/api/v1/settings')
export const updateSettings = (data) => axiosInstance.put('/api/v1/settings/admin/update', data)