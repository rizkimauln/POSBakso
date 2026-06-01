import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { getNavigationForRole } from '../../config/navigation'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../common/Button'

export function Sidebar({ onNavigate }) {
  const { logout, user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const items = getNavigationForRole(user?.role || 'kasir')

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-center border-b border-slate-200">
        <img alt="POS Bakso" className="h-10 object-contain" src="/images/Logo Red 1.png" />
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {items.map((item) => (
          <NavLink
            className={({ isActive }) =>
              [
                'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-red-50 text-red-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              ].join(' ')
            }
            end={item.path === '/app'}
            key={item.path}
            onClick={onNavigate}
            to={item.path}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-between border-t border-slate-200 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{user?.name || 'User'}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role || 'kasir'}</p>
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700 transition"
          disabled={isLoggingOut}
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  )
}
