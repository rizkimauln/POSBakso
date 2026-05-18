import { Navigate } from 'react-router-dom'
import { LoadingState } from '../components/common/LoadingState'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth()

  if (isBootstrapping) {
    return <LoadingState label="Menyiapkan sesi..." />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate replace to="/app" />
  }

  return children
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <LoadingState label="Menyiapkan sesi..." />
  }

  if (isAuthenticated) {
    return <Navigate replace to="/app" />
  }

  return children
}
