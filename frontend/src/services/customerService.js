import { api } from '../lib/api'

const LAST_PUBLIC_TOKEN_KEY = 'posbakso.customer.last_public_token'
const LAST_QR_TOKEN_KEY = 'posbakso.customer.last_qr_token'

export const customerService = {
  async resolveTable(qrToken) {
    const response = await api.get(`/public/tables/${qrToken}`)
    return response.data.data
  },

  async listMenus(params = {}) {
    const response = await api.get('/public/menus', { params })
    return response.data
  },

  async createOrder(payload) {
    const response = await api.post('/public/orders', payload)
    return response.data.data
  },

  async getOrder(publicToken) {
    const response = await api.get(`/public/orders/${publicToken}`)
    return response.data.data
  },

  async submitPayment(publicToken, payload) {
    const response = await api.post(`/public/orders/${publicToken}/payment`, payload)
    return response.data.data
  },

  async listTables() {
    const response = await api.get('/public/tables')
    return response.data.data
  },

  async listReviews() {
    const response = await api.get('/public/reviews')
    return response.data.data
  },

  async submitReview(payload) {
    const response = await api.post('/public/reviews', payload)
    return response.data.data
  },

  rememberPublicToken(publicToken) {
    window.localStorage.setItem(LAST_PUBLIC_TOKEN_KEY, publicToken)
  },

  getRememberedPublicToken() {
    return window.localStorage.getItem(LAST_PUBLIC_TOKEN_KEY)
  },

  rememberQrToken(qrToken) {
    window.localStorage.setItem(LAST_QR_TOKEN_KEY, qrToken)
  },

  getRememberedQrToken() {
    return window.localStorage.getItem(LAST_QR_TOKEN_KEY)
  },
}
