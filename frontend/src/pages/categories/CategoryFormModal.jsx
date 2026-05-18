import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { useToast } from '../../hooks/useToast'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { categoryService } from '../../services/categoryService'

export function CategoryFormModal({ category, isOpen, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(category)
  const { showToast } = useToast()

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setMessage('')
    setIsSaving(true)

    try {
      const payload = { name: name.trim() }

      if (isEditing) {
        await categoryService.update(category.id, payload)
      } else {
        await categoryService.create(payload)
      }

      showToast({
        title: isEditing ? 'Kategori diperbarui' : 'Kategori ditambahkan',
        tone: 'success',
      })
      onSaved()
      onClose()
    } catch (error) {
      setErrors(getValidationErrors(error))
      setMessage(getApiMessage(error, 'Kategori gagal disimpan.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit kategori' : 'Tambah kategori'}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {message ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        ) : null}

        <Input
          autoFocus
          error={errors.name?.[0]}
          id="category-name"
          label="Nama kategori"
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
          placeholder="Contoh: Bakso"
          value={name}
        />

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
