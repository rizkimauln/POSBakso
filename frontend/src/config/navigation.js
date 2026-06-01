import {
  BarChart3,
  Bell,
  ClipboardList,
  LayoutDashboard,
  ReceiptText,
  ShoppingBag,
  Tags,
  Utensils,
  Users,
} from 'lucide-react'

export const navigationItems = [
  {
    label: 'Dashboard',
    path: '/app',
    icon: LayoutDashboard,
    roles: ['admin', 'kasir'],
  },
  {
    label: 'Pesanan',
    path: '/app/orders',
    icon: ClipboardList,
    roles: ['admin', 'kasir'],
  },
  {
    label: 'Pesanan Masuk',
    path: '/app/incoming-orders',
    icon: Bell,
    roles: ['admin', 'kasir'],
  },
  {
    label: 'Pembayaran',
    path: '/app/checkout',
    icon: ReceiptText,
    roles: ['admin', 'kasir'],
  },
  {
    label: 'Meja',
    path: '/app/tables',
    icon: Utensils,
    roles: ['admin'],
  },
  {
    label: 'Kategori',
    path: '/app/categories',
    icon: Tags,
    roles: ['admin'],
  },
  {
    label: 'Menu',
    path: '/app/menus',
    icon: ShoppingBag,
    roles: ['admin'],
  },
  {
    label: 'Laporan',
    path: '/app/reports',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    label: 'Pengguna',
    path: '/app/users',
    icon: Users,
    roles: ['admin'],
  },
]

export function getNavigationForRole(role) {
  return navigationItems.filter((item) => item.roles.includes(role))
}
