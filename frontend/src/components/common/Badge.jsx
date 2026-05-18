const toneClasses = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
}

export function Badge({ children, className = '', tone = 'default' }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
