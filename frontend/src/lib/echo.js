import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { env } from '../config/env'
import { getToken } from './storage'

let echoInstance = null

export function getEcho() {
  if (echoInstance) {
    return echoInstance
  }

  window.Pusher = Pusher

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: env.pusher.key,
    cluster: env.pusher.cluster,
    forceTLS: true,
    authEndpoint: env.broadcastAuthUrl,
    auth: {
      headers: {
        Authorization: `Bearer ${getToken() || ''}`,
        Accept: 'application/json',
      },
    },
  })

  return echoInstance
}

export function resetEcho() {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}
