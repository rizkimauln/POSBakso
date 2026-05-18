export function LoadingState({ label = 'Memuat data...' }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-700" />
        {label}
      </div>
    </div>
  )
}
