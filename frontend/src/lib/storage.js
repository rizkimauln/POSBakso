const TOKEN_KEY = 'posbakso.auth.token'
const USER_KEY = 'posbakso.auth.user'

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser() {
  const rawUser = window.localStorage.getItem(USER_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    window.localStorage.removeItem(USER_KEY)
    return null
  }
}

export function setStoredUser(user) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  window.localStorage.removeItem(USER_KEY)
}

export function clearAuthStorage() {
  clearToken()
  clearStoredUser()
}
