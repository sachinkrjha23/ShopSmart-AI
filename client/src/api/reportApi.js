import axiosInstance from '../lib/axios'

export const submitReport = (data) => axiosInstance.post('/api/v1/report/request', data)

export const getAdminReports = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return axiosInstance.get(`/api/v1/report/admin${query ? `?${query}` : ''}`)
}

export const resolveReport = (reportId, data) =>
  axiosInstance.patch(`/api/v1/report/admin/${reportId}`, data)