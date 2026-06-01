import { api } from '../lib/api'

export const reportService = {
  async dashboard() {
    const response = await api.get('/reports/daily', { params: { dashboard: 1 } })
    return response.data.data
  },

  async daily(params = {}) {
    const response = await api.get('/reports/daily', { params })
    return response.data.data
  },

  async sales(params = {}) {
    const response = await api.get('/reports/sales', { params })
    return response.data.data
  },

  async bestSellingMenus(params = {}) {
    const response = await api.get('/reports/best-selling-menus', { params })
    return response.data.data
  },
}
