import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext } from './toastContextValue'

const toneStyles = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    iconClassName: 'text-emerald-700',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-900',
    iconClassName: 'text-red-700',
  },
  info: {
    icon: Info,
    className: 'border-slate-200 bg-white text-slate-900',
    iconClassName: 'text-red-700',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    ({ description, title, tone = 'info' }) => {
      const id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
      const toast = { description, id, title, tone }

      setToasts((current) => [toast, ...current].slice(0, 4))
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone] || toneStyles.info
          const Icon = style.icon

          return (
            <div
              className={[
                'pointer-events-auto rounded-xl border p-4 shadow-lg shadow-slate-900/10',
                style.className,
              ].join(' ')}
              key={toast.id}
              role="status"
            >
              <div className="flex items-start gap-3">
                <Icon className={['mt-0.5 h-5 w-5 shrink-0', style.iconClassName].join(' ')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm opacity-80">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  aria-label="Tutup notifikasi"
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
                  onClick={() => dismissToast(toast.id)}
                  title="Tutup notifikasi"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
