import { api } from '../lib/api'

export const menuService = {
  async list(params = {}) {
    const response = await api.get('/menus', { params })
    return response.data
  },

  async create(payload) {
    const response = await api.post('/menus', toMenuFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  async update(menuId, payload) {
    const formData = toMenuFormData(payload)
    formData.append('_method', 'PUT')

    const response = await api.post(`/menus/${menuId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  async toggleActive(menuId) {
    const response = await api.patch(`/menus/${menuId}/toggle-active`)
    return response.data.data
  },

  async remove(menuId) {
    const response = await api.delete(`/menus/${menuId}`)
    return response.data
  },
}

function toMenuFormData(payload) {
  const formData = new FormData()

  formData.append('category_id', payload.category_id)
  formData.append('name', payload.name)
  formData.append('description', payload.description || '')
  formData.append('price', payload.price)
  formData.append('is_active', payload.is_active ? '1' : '0')

  if (payload.image) {
    formData.append('image', payload.image)
  }

  return formData
}
