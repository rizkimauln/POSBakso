import { Outlet } from 'react-router-dom'

export function CustomerLayout() {
  return (
    <main className="min-h-screen bg-slate-200">
      <div className="mx-auto min-h-screen max-w-md bg-slate-50 shadow-sm">
        <Outlet />
      </div>
    </main>
  )
}
