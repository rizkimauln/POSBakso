const variants = {
  primary:
    'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700 disabled:bg-red-300',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-red-700 disabled:text-slate-400',
  ghost:
    'text-slate-600 hover:bg-slate-100 focus-visible:outline-red-700 disabled:text-slate-400',
  danger:
    'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-red-700 disabled:text-red-300',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export function Button({
  children,
  className = '',
  isLoading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      disabled={isLoading || props.disabled}
      type={type}
      {...props}
    >
      {isLoading ? 'Memproses...' : children}
    </button>
  )
}
