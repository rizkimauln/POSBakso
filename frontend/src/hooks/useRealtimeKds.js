import { useEffect } from 'react'
import { getEcho } from '../lib/echo'

export function useRealtimeKds(handlers = {}) {
  useEffect(() => {
    const channel = getEcho().private('kds.orders')

    channel.listen('.order.created', handlers.onOrderCreated || (() => {}))
    channel.listen(
      '.order.status.updated',
      handlers.onOrderStatusUpdated || (() => {}),
    )
    channel.listen(
      '.order.item.status.updated',
      handlers.onOrderItemStatusUpdated || (() => {}),
    )
    channel.listen('.order.completed', handlers.onOrderCompleted || (() => {}))

    return () => {
      getEcho().leave('private-kds.orders')
    }
  }, [handlers])
}
