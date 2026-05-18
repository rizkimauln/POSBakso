import { Inbox } from 'lucide-react'

export function EmptyState({
  action,
  description = 'Data akan tampil di sini setelah tersedia.',
  title = 'Belum ada data',
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <Inbox className="h-10 w-10 text-slate-400" />
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
