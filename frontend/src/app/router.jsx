import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AppLayout } from '../components/layout/AppLayout'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { CategoryListPage } from '../pages/categories/CategoryListPage'
import { MenuListPage } from '../pages/menus/MenuListPage'
import { TableListPage } from '../pages/tables/TableListPage'
import { CashierOrderPage } from '../pages/orders/CashierOrderPage'
import { OrderDetailPage } from '../pages/orders/OrderDetailPage'
import { CheckoutPage } from '../pages/orders/CheckoutPage'
import { IncomingOrdersPage } from '../pages/orders/IncomingOrdersPage'
import { ReportsPage } from '../pages/reports/ReportsPage'
import { UserListPage } from '../pages/users/UserListPage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { HomePage } from '../pages/HomePage'
import { CustomerMenuPage } from '../pages/customer/CustomerMenuPage'
import { CustomerOrderStatusPage } from '../pages/customer/CustomerOrderStatusPage'
import { ProtectedRoute, PublicOnlyRoute } from './routeGuards'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    path: '/app',
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'orders', element: <CashierOrderPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'incoming-orders', element: <IncomingOrdersPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      {
        path: 'categories',
        element: (
          <ProtectedRoute roles={['admin']}>
            <CategoryListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'menus',
        element: (
          <ProtectedRoute roles={['admin']}>
            <MenuListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tables',
        element: (
          <ProtectedRoute roles={['admin']}>
            <TableListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute roles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute roles={['admin']}>
            <UserListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute roles={['admin']}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    element: <CustomerLayout />,
    path: '/customer',
    children: [
      { path: 'menu', element: <CustomerMenuPage /> },
      { path: 'tables/:qrToken', element: <CustomerMenuPage /> },
      { path: 'orders/:publicToken', element: <CustomerOrderStatusPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/app" />,
  },
])
