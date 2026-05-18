import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { Select } from '../../components/common/Select'
import { tableStatuses } from '../../config/tableStatuses'
import { useToast } from '../../hooks/useToast'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { tableService } from '../../services/tableService'

export function TableFormModal({ isOpen, onClose, onSaved, table }) {
  const [form, setForm] = useState({
    table_number: table?.table_number || '',
    status: table?.status || 'kosong',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(table)
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
        table_number: form.table_number.trim(),
        status: form.status,
      }

      if (isEditing) {
        await tableService.update(table.id, payload)
      } else {
        await tableService.create(payload)
      }

      showToast({
        title: isEditing ? 'Meja diperbarui' : 'Meja ditambahkan',
        tone: 'success',
      })
      onSaved()
      onClose()
    } catch (error) {
      setErrors(getValidationErrors(error))
      setMessage(getApiMessage(error, 'Meja gagal disimpan.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit meja' : 'Tambah meja'}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        {message ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        ) : null}

        <Input
          autoFocus
          error={errors.table_number?.[0]}
          id="table-number"
          label="Nomor meja"
          maxLength={50}
          name="table_number"
          onChange={updateField}
          placeholder="M13"
          value={form.table_number}
        />

        <Select
          error={errors.status?.[0]}
          id="table-status"
          label="Status"
          name="status"
          onChange={updateField}
          value={form.status}
        >
          {tableStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>

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
