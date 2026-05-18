import { api, getApiData } from '../lib/api'

export const authService = {
  async login(payload) {
    const response = await api.post('/login', payload)
    return getApiData(response)
  },

  async me() {
    const response = await api.get('/me')
    return getApiData(response)
  },

  async logout() {
    const response = await api.post('/logout')
    return getApiData(response)
  },
}
