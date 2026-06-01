import { Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { navigationItems } from '../../config/navigation'
export function Topbar({ onOpenMenu }) {
  const location = useLocation()
  const currentItem =
    [...navigationItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname.startsWith(item.path)) || navigationItems[0]

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          aria-label="Buka menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
          onClick={onOpenMenu}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-950">{currentItem.label}</h1>
        </div>
      </div>

      <div className="hidden h-10 w-72 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 md:flex">
        <Search className="h-4 w-4" />
        Cari Data Operasional
      </div>
    </header>
  )
}
