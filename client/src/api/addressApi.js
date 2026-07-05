import axiosInstance from '../lib/axios'

export const getAddresses = () => axiosInstance.get('/api/v1/address')
export const createAddress = (data) => axiosInstance.post('/api/v1/address/add', data)
export const updateAddressById = (id, data) => axiosInstance.put(`/api/v1/address/edit/${id}`, data)
export const setDefaultAddressById = (id) => axiosInstance.put(`/api/v1/address/set-default/${id}`)
export const deleteAddressById = (id) => axiosInstance.delete(`/api/v1/address/delete/${id}`)