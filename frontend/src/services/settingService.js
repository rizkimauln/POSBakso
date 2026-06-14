import { api } from '../lib/api'

export const settingService = {
  getPublicSettings: async () => {
    const { data } = await api.get('/public/settings')
    return data.data
  },

  uploadQris: async (file) => {
    const formData = new FormData()
    formData.append('qris_image', file)

    const { data } = await api.post('/settings/qris', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data.data
  }
}
