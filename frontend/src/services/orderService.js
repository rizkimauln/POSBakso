import { api } from '../lib/api'

export const orderService = {
  async list(params = {}) {
    const response = await api.get('/orders', { params })
    return response.data
  },

  async create(payload) {
    const response = await api.post('/orders', payload)
    return response.data.data
  },

  async update(orderId, payload) {
    const response = await api.put(`/orders/${orderId}`, payload)
    return response.data.data
  },

  async getInvoice(orderId) {
    const response = await api.get(`/orders/${orderId}/invoice`)
    return response.data.data
  },

  async show(orderId) {
    const response = await api.get(`/orders/${orderId}`)
    return response.data.data
  },

  async updateStatus(orderId, orderStatus) {
    const response = await api.patch(`/orders/${orderId}/status`, {
      order_status: orderStatus
    })
    return response.data.data
  },

  async checkout(orderId, paymentMethod, additionalData = {}) {
    const response = await api.post(`/orders/${orderId}/checkout`, {
      payment_method: paymentMethod,
      ...additionalData
    })
    return response.data.data
  },
}
