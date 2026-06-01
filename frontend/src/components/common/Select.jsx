export function Select({
  children,
  error,
  helpText,
  id,
  label,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="block text-sm font-semibold text-slate-700" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select
        className={[
          'h-11 w-full rounded-lg border bg-white pl-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100 text-ellipsis overflow-hidden whitespace-nowrap',
          error ? 'border-red-500' : 'border-slate-300',
          className,
        ].join(' ')}
        id={id}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!error && helpText ? <p className="text-sm text-slate-500">{helpText}</p> : null}
    </div>
  )
}
