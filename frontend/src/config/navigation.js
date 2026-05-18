import {
  BarChart3,
  ChefHat,
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
    label: 'Orders',
    path: '/app/orders',
    icon: ClipboardList,
    roles: ['admin', 'kasir'],
  },
  {
    label: 'KDS',
    path: '/app/kds',
    icon: ChefHat,
    roles: ['admin', 'kasir'],
  },
  {
    label: 'Categories',
    path: '/app/categories',
    icon: Tags,
    roles: ['admin'],
  },
  {
    label: 'Menus',
    path: '/app/menus',
    icon: ShoppingBag,
    roles: ['admin'],
  },
  {
    label: 'Tables',
    path: '/app/tables',
    icon: Utensils,
    roles: ['admin'],
  },
  {
    label: 'Reports',
    path: '/app/reports',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    label: 'Users',
    path: '/app/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Checkout',
    path: '/app/checkout',
    icon: ReceiptText,
    roles: ['kasir'],
  },
]

export function getNavigationForRole(role) {
  return navigationItems.filter((item) => item.roles.includes(role))
}
