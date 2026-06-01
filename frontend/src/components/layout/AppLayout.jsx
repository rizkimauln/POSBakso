import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-100 print:bg-white print:block">
      <div className="sticky top-0 hidden h-screen lg:block print:hidden">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col print:block">
        <div className="print:hidden">
          <Topbar onOpenMenu={() => setIsMobileMenuOpen(true)} />
        </div>
        <main className="flex-1 p-4 lg:p-6 print:p-0 print:m-0 print:block">
          <Outlet />
        </main>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          />
          <div className="relative h-full w-72 max-w-[85vw] bg-white shadow-2xl">
            <button
              aria-label="Tutup menu"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
