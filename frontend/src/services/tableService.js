import { api } from '../lib/api'

export const tableService = {
  async list(params = {}) {
    const response = await api.get('/tables', { params })
    return response.data
  },

  async create(payload) {
    const response = await api.post('/tables', payload)
    return response.data.data
  },

  async update(tableId, payload) {
    const response = await api.put(`/tables/${tableId}`, payload)
    return response.data.data
  },

  async updateStatus(tableId, status) {
    const response = await api.patch(`/tables/${tableId}/status`, { status })
    return response.data.data
  },

  async regenerateQr(tableId) {
    const response = await api.post(`/tables/${tableId}/regenerate-qr`)
    return response.data.data
  },

  async remove(tableId) {
    const response = await api.delete(`/tables/${tableId}`)
    return response.data
  },
}
