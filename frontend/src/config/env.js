export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  broadcastAuthUrl:
    import.meta.env.VITE_BROADCAST_AUTH_URL ||
    'http://localhost:8000/broadcasting/auth',
  pusher: {
    key: import.meta.env.VITE_PUSHER_APP_KEY || '',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
  },
}
