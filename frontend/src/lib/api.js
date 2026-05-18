import axios from 'axios'
import { env } from '../config/env'
import { clearAuthStorage, getToken } from './storage'

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    return Promise.reject(error)
  },
)

export function getApiData(response) {
  return response.data?.data ?? response.data
}

export function getApiMessage(error, fallback = 'Terjadi kesalahan.') {
  return error.response?.data?.message || error.message || fallback
}

export function getValidationErrors(error) {
  return error.response?.data?.errors || {}
}
