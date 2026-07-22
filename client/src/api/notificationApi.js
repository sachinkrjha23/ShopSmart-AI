import axiosInstance from '../lib/axios'

export const getMyNotifications = (params) =>
  axiosInstance.get('/api/v1/notification/my', { params })

export const markNotificationReadApi = (id) =>
  axiosInstance.patch(`/api/v1/notification/${id}/read`)

export const dismissNotificationApi = (id) =>
  axiosInstance.patch(`/api/v1/notification/${id}/dismiss`)

export const createBroadcastNotification = (data) =>
  axiosInstance.post('/api/v1/notification/admin/broadcast', data)