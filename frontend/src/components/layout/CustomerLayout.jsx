import { Outlet } from 'react-router-dom'

export function CustomerLayout() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="min-h-screen w-full bg-slate-50">
        <Outlet />
      </div>
    </main>
  )
}
