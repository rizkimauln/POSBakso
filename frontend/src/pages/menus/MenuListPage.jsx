import { useEffect, useState } from 'react'
import { Edit, Plus, RefreshCcw, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { EmptyState } from '../../components/common/EmptyState'
import { Input } from '../../components/common/Input'
import { LoadingState } from '../../components/common/LoadingState'
import { Select } from '../../components/common/Select'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../hooks/useToast'
import { getApiMessage } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { categoryService } from '../../services/categoryService'
import { menuService } from '../../services/menuService'
import { MenuFormModal } from './MenuFormModal'

export function MenuListPage() {
  const [menus, setMenus] = useState([])
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ search: '', category_id: '', is_active: '' })
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState({ isOpen: false, menu: null })
  const [busyId, setBusyId] = useState(null)
  const debouncedSearch = useDebounce(filters.search, 350)
  const { showToast } = useToast()

  async function loadMenus(options = {}) {
    setIsLoading(true)
    setError('')

    try {
      const response = await menuService.list({
        page: options.page || page,
        per_page: 10,
        search: options.search ?? debouncedSearch,
        category_id: options.category_id ?? filters.category_id,
        is_active: options.is_active ?? filters.is_active,
      })

      setMenus(response.data || [])
      setMeta(response.meta || null)
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Data menu gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      categoryService.list({ per_page: 100 }),
      menuService.list({
        page,
        per_page: 10,
        search: debouncedSearch,
        category_id: filters.category_id,
        is_active: filters.is_active,
      }),
    ])
      .then(([categoryResponse, menuResponse]) => {
        if (!isMounted) {
          return
        }

        setCategories(categoryResponse.data || [])
        setMenus(menuResponse.data || [])
        setMeta(menuResponse.meta || null)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Data menu gagal dimuat.'))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, filters.category_id, filters.is_active, page])

  function updateFilter(name, value) {
    setIsLoading(true)
    setPage(1)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setFormState({ isOpen: true, menu: null })
  }

  function openEditModal(menu) {
    setFormState({ isOpen: true, menu })
  }

  function closeFormModal() {
    setFormState({ isOpen: false, menu: null })
  }

  async function handleToggle(menu) {
    setBusyId(menu.id)
    setError('')

    try {
      await menuService.toggleActive(menu.id)
      await loadMenus()
      showToast({
        title: menu.is_active ? 'Menu dinonaktifkan' : 'Menu diaktifkan',
        tone: 'success',
      })
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Status menu gagal diperbarui.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(menu) {
    const isConfirmed = window.confirm(`Hapus menu "${menu.name}"?`)

    if (!isConfirmed) {
      return
    }

    setBusyId(menu.id)
    setError('')

    try {
      await menuService.remove(menu.id)
      await loadMenus()
      showToast({ title: 'Menu dihapus', tone: 'success' })
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Menu gagal dihapus.'))
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Menu',
      render: (menu) => (
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-sm font-bold text-slate-400">
            {menu.image_url ? (
              <img alt="" className="h-full w-full object-cover" src={menu.image_url} />
            ) : (
              menu.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-950">{menu.name}</p>

          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (menu) => menu.category?.name || '-',
    },
    {
      key: 'price',
      label: 'Harga',
      render: (menu) => <span className="font-semibold">{formatRupiah(menu.price)}</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (menu) => (
        <Badge tone={menu.is_active ? 'success' : 'default'}>
          {menu.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (menu) => (
        <div className="flex justify-end gap-2">
          <Button
            disabled={busyId === menu.id}
            onClick={() => handleToggle(menu)}
            size="sm"
            variant="secondary"
          >
            {menu.is_active ? (
              <ToggleRight className="h-4 w-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {menu.is_active ? 'Matikan' : 'Aktifkan'}
          </Button>
          <Button onClick={() => openEditModal(menu)} size="sm" variant="secondary">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            disabled={busyId === menu.id}
            isLoading={busyId === menu.id}
            onClick={() => handleDelete(menu)}
            size="sm"
            variant="danger"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        </div>
      ),
    },
  ]

  const hasActiveFilter = filters.search || filters.category_id || filters.is_active

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Tambah menu
        </Button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto] lg:items-end">
          <Input
            id="menu-search"
            label="Cari Menu"
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Bakso urat, es teh..."
            value={filters.search}
          />
          <Select
            id="menu-category-filter"
            label="Kategori"
            onChange={(event) => updateFilter('category_id', event.target.value)}
            value={filters.category_id}
          >
            <option value="">Semua Kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            id="menu-active-filter"
            label="Status"
            onChange={(event) => updateFilter('is_active', event.target.value)}
            value={filters.is_active}
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState label="Memuat menu..." />
      ) : menus.length ? (
        <DataTable columns={columns} data={menus} />
      ) : (
        <EmptyState
          action={
            hasActiveFilter ? (
              <Button
                onClick={() => {
                  setIsLoading(true)
                  setPage(1)
                  setFilters({ search: '', category_id: '', is_active: '' })
                }}
                variant="secondary"
              >
                <Search className="h-4 w-4" />
                Reset Filter
              </Button>
            ) : (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Tambah menu
              </Button>
            )
          }
          description={
            hasActiveFilter
              ? 'Coba kata kunci atau filter lain.'
              : 'Menu akan tampil di kasir dan customer QR setelah dibuat.'
          }
          title={hasActiveFilter ? 'Menu tidak ditemukan' : 'Belum ada menu'}
        />
      )}

      {meta ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 px-4 py-3 text-sm text-slate-500 md:flex-row">
          <p>
            Halaman {meta.current_page} dari {meta.last_page} · {meta.total} menu
          </p>
          <div className="flex gap-2">
            <Button
              disabled={meta.current_page <= 1 || isLoading}
              onClick={() => {
                setIsLoading(true)
                setPage((current) => Math.max(current - 1, 1))
              }}
              size="sm"
              variant="secondary"
            >
              Sebelumnya
            </Button>
            <Button
              disabled={meta.current_page >= meta.last_page || isLoading}
              onClick={() => {
                setIsLoading(true)
                setPage((current) => current + 1)
              }}
              size="sm"
              variant="secondary"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}

      {formState.isOpen ? (
        <MenuFormModal
          categories={categories}
          isOpen={formState.isOpen}
          key={formState.menu?.id || 'create'}
          menu={formState.menu}
          onClose={closeFormModal}
          onSaved={() => loadMenus({ page: 1 })}
        />
      ) : null}
    </div>
  )
}
