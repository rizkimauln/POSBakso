import { useState } from 'react'
import { KeyRound, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { useAuth } from '../../hooks/useAuth'
import { getApiMessage, getValidationErrors } from '../../lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function fillDemoAccount(role) {
    const email = role === 'admin' ? 'admin@posbakso.test' : 'kasir@posbakso.test'
    setForm({ email, password: 'password' })
    setErrors({})
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setMessage('')
    setIsLoading(true)

    try {
      await login(form)
      navigate('/app', { replace: true })
    } catch (error) {
      setErrors(getValidationErrors(error))
      setMessage(getApiMessage(error, 'Login gagal. Periksa email dan password.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-sm font-semibold uppercase text-[#af101a]">Masuk dashboard</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">POS Warung Bakso</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Gunakan akun admin atau kasir untuk membuka area operasional.
        </p>
      </div>

      {message ? (
        <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm transition hover:border-red-200 hover:bg-red-50"
          onClick={() => fillDemoAccount('admin')}
          type="button"
        >
          <span className="block font-semibold text-slate-950">Admin</span>
          <span className="text-xs text-slate-500">Full access</span>
        </button>
        <button
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm transition hover:border-red-200 hover:bg-red-50"
          onClick={() => fillDemoAccount('kasir')}
          type="button"
        >
          <span className="block font-semibold text-slate-950">Kasir</span>
          <span className="text-xs text-slate-500">Operasional</span>
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <Input
          autoComplete="email"
          error={errors.email?.[0]}
          id="email"
          label="Email"
          name="email"
          onChange={updateField}
          placeholder="admin@posbakso.test"
          type="email"
          value={form.email}
        />
        <Input
          autoComplete="current-password"
          error={errors.password?.[0]}
          id="password"
          label="Password"
          name="password"
          onChange={updateField}
          placeholder="password"
          type="password"
          value={form.password}
        />
      </div>

      <Button className="mt-6 w-full" isLoading={isLoading} type="submit">
        <KeyRound className="h-4 w-4" />
        Masuk
      </Button>

      <div className="mt-5 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
        Akun default dari seeder: admin atau kasir dengan password <strong>password</strong>.
      </div>
    </form>
  )
}
