import { Outlet } from 'react-router-dom'
import { Beef, ChefHat, ClipboardList, ReceiptText } from 'lucide-react'


export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <Outlet />
    </main>
  )
}
