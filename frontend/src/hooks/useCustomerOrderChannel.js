import { useEffect } from 'react'
import { getEcho } from '../lib/echo'

export function useCustomerOrderChannel(publicToken, handlers = {}) {
  useEffect(() => {
    if (!publicToken) {
      return undefined
    }

    const channelName = `orders.${publicToken}`
    const channel = getEcho().channel(channelName)

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
      getEcho().leave(channelName)
    }
  }, [handlers, publicToken])
}
