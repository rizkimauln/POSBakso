import { useMemo, useState } from 'react'
import { ImagePlus, Save } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { Select } from '../../components/common/Select'
import { useToast } from '../../hooks/useToast'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { menuService } from '../../services/menuService'

export function MenuFormModal({ categories, isOpen, menu, onClose, onSaved }) {
  const [form, setForm] = useState({
    category_id: menu?.category_id ? String(menu.category_id) : '',
    name: menu?.name || '',
    description: menu?.description || '',
    price: menu?.price ? String(menu.price) : '',
    is_active: menu?.is_active ?? true,
    image: null,
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(menu)
  const { showToast } = useToast()

  const imagePreview = useMemo(() => {
    if (form.image) {
      return URL.createObjectURL(form.image)
    }

    return menu?.image_url || null
  }, [form.image, menu])

  function updateField(event) {
    const { name, type, value, checked, files } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : files ? files[0] || null : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setMessage('')
    setIsSaving(true)

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
      }

      if (isEditing) {
        await menuService.update(menu.id, payload)
      } else {
        await menuService.create(payload)
      }

      showToast({
        title: isEditing ? 'Menu diperbarui' : 'Menu ditambahkan',
        tone: 'success',
      })
      onSaved()
      onClose()
    } catch (error) {
      setErrors(getValidationErrors(error))
      setMessage(getApiMessage(error, 'Menu gagal disimpan.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit menu' : 'Tambah menu'}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        {message ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            error={errors.category_id?.[0]}
            id="menu-category"
            label="Kategori"
            name="category_id"
            onChange={updateField}
            value={form.category_id}
          >
            <option value="">Pilih kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Input
            error={errors.price?.[0]}
            helpText={form.price ? formatRupiah(form.price) : 'Masukkan angka rupiah.'}
            id="menu-price"
            label="Harga"
            min="0"
            name="price"
            onChange={updateField}
            placeholder="26000"
            type="number"
            value={form.price}
          />
        </div>

        <Input
          error={errors.name?.[0]}
          id="menu-name"
          label="Nama menu"
          maxLength={150}
          name="name"
          onChange={updateField}
          placeholder="Bakso Urat Jumbo"
          value={form.name}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="menu-description">
            Deskripsi
          </label>
          <textarea
            className={[
              'min-h-28 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-700 focus:ring-2 focus:ring-red-100',
              errors.description ? 'border-red-500' : 'border-slate-300',
            ].join(' ')}
            id="menu-description"
            maxLength={1000}
            name="description"
            onChange={updateField}
            placeholder="Deskripsi singkat menu untuk kasir/customer."
            value={form.description}
          />
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {imagePreview ? (
              <img alt="" className="h-full w-full object-cover" src={imagePreview} />
            ) : (
              <ImagePlus className="h-9 w-9 text-slate-400" />
            )}
          </div>
          <div className="space-y-3">
            <Input
              accept="image/jpeg,image/png,image/webp"
              error={errors.image?.[0]}
              id="menu-image"
              label="Gambar menu"
              name="image"
              onChange={updateField}
              type="file"
            />
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <input
                checked={form.is_active}
                className="h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-700"
                name="is_active"
                onChange={updateField}
                type="checkbox"
              />
              Menu aktif
            </label>
          </div>
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
