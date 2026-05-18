import { api } from '../lib/api'

export const kdsService = {
  async activeOrders() {
    const response = await api.get('/kds/orders')
    return response.data.data || []
  },

  async updateItemStatus(orderItemId, itemStatus) {
    const response = await api.patch(`/kds/order-items/${orderItemId}/status`, {
      item_status: itemStatus,
    })
    return response.data.data
  },
}
