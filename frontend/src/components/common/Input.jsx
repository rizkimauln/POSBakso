export function Input({
  error,
  helpText,
  id,
  label,
  type = 'text',
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
      <input
        className={[
          'h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-700 focus:ring-2 focus:ring-red-100',
          error ? 'border-red-500' : 'border-slate-300',
          className,
        ].join(' ')}
        id={id}
        type={type}
        {...props}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!error && helpText ? <p className="text-sm text-slate-500">{helpText}</p> : null}
    </div>
  )
}
