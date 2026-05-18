import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { Select } from '../../components/common/Select'
import { useToast } from '../../hooks/useToast'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { userService } from '../../services/userService'

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'kasir', label: 'Kasir' },
]

export function UserFormModal({ isOpen, onClose, onSaved, user }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'kasir',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(user)
  const { showToast } = useToast()

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setMessage('')
    setIsSaving(true)

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      }

      if (form.password) {
        payload.password = form.password
      }

      if (isEditing) {
        await userService.update(user.id, payload)
      } else {
        await userService.create({ ...payload, password: form.password })
      }

      showToast({
        title: isEditing ? 'User diperbarui' : 'User ditambahkan',
        tone: 'success',
      })
      onSaved()
      onClose()
    } catch (error) {
      setErrors(getValidationErrors(error))
      setMessage(getApiMessage(error, 'User gagal disimpan.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit user' : 'Tambah user'}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        {message ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        ) : null}

        <Input
          autoFocus
          error={errors.name?.[0]}
          id="user-name"
          label="Nama"
          maxLength={150}
          name="name"
          onChange={updateField}
          placeholder="Kasir Baru"
          value={form.name}
        />

        <Input
          autoComplete="email"
          error={errors.email?.[0]}
          id="user-email"
          label="Email"
          maxLength={150}
          name="email"
          onChange={updateField}
          placeholder="kasir.baru@posbakso.test"
          type="email"
          value={form.email}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            autoComplete="new-password"
            error={errors.password?.[0]}
            helpText={isEditing ? 'Kosongkan jika tidak ingin mengganti password.' : 'Minimal 8 karakter.'}
            id="user-password"
            label={isEditing ? 'Password baru' : 'Password'}
            name="password"
            onChange={updateField}
            placeholder="password"
            type="password"
            value={form.password}
          />

          <Select
            error={errors.role?.[0]}
            id="user-role"
            label="Role"
            name="role"
            onChange={updateField}
            value={form.role}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Batal
          </Button>
          <Button isLoading={isSaving} type="submit">
            <Save className="h-4 w-4" />
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
