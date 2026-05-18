export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  broadcastAuthUrl:
    import.meta.env.VITE_BROADCAST_AUTH_URL ||
    'http://localhost:8000/broadcasting/auth',
  reverb: {
    key: import.meta.env.VITE_REVERB_APP_KEY || '',
    host: import.meta.env.VITE_REVERB_HOST || 'localhost',
    port: Number(import.meta.env.VITE_REVERB_PORT || 8080),
    scheme: import.meta.env.VITE_REVERB_SCHEME || 'http',
  },
}
