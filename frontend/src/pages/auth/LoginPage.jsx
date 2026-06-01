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
      <div className="flex flex-col items-center text-center">
        <img src="/images/Logo Red 1.png" alt="POS Bakso" className="h-28 object-contain mb-4" />
        <p className="text-sm font-semibold uppercase text-[#af101a] tracking-wider mb-2">Masuk dashboard</p>
        <p className="text-sm leading-6 text-slate-500">
          Gunakan akun admin atau kasir untuk membuka area operasional.
        </p>
      </div>

      {message ? (
        <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}



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


    </form>
  )
}
