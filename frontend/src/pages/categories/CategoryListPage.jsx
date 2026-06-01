import { useEffect, useState } from 'react'
import { Edit, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { EmptyState } from '../../components/common/EmptyState'
import { Input } from '../../components/common/Input'
import { LoadingState } from '../../components/common/LoadingState'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../hooks/useToast'
import { getApiMessage } from '../../lib/api'
import { categoryService } from '../../services/categoryService'
import { CategoryFormModal } from './CategoryFormModal'

export function CategoryListPage() {
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState({ isOpen: false, category: null })
  const [deleteState, setDeleteState] = useState({ id: null, isDeleting: false })
  const debouncedSearch = useDebounce(search, 350)
  const { showToast } = useToast()

  async function loadCategories(options = {}) {
    setIsLoading(true)
    setError('')

    try {
      const response = await categoryService.list({
        page: options.page || page,
        search: options.search ?? debouncedSearch,
        per_page: 10,
      })

      setCategories(response.data || [])
      setMeta(response.meta || null)
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Data kategori gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    categoryService
      .list({ page, search: debouncedSearch, per_page: 10 })
      .then((response) => {
        if (!isMounted) {
          return
        }

        setCategories(response.data || [])
        setMeta(response.meta || null)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Data kategori gagal dimuat.'))
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
  }, [debouncedSearch, page])

  function openCreateModal() {
    setFormState({ isOpen: true, category: null })
  }

  function openEditModal(category) {
    setFormState({ isOpen: true, category })
  }

  function closeFormModal() {
    setFormState({ isOpen: false, category: null })
  }

  async function handleDelete(category) {
    const isConfirmed = window.confirm(`Hapus kategori "${category.name}"?`)

    if (!isConfirmed) {
      return
    }

    setDeleteState({ id: category.id, isDeleting: true })
    setError('')

    try {
      await categoryService.remove(category.id)
      await loadCategories()
      showToast({ title: 'Kategori dihapus', tone: 'success' })
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Kategori gagal dihapus.'))
    } finally {
      setDeleteState({ id: null, isDeleting: false })
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Kategori',
      render: (category) => (
        <div>
          <p className="font-semibold text-slate-950">{category.name}</p>
          <p className="text-xs text-slate-500">ID #{category.id}</p>
        </div>
      ),
    },
    {
      key: 'menus_count',
      label: 'Jumlah menu',
      render: (category) => (
        <Badge tone={category.menus_count > 0 ? 'info' : 'default'}>
          {category.menus_count || 0} menu
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Dibuat',
      render: (category) =>
        category.created_at
          ? new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(category.created_at))
          : '-',
    },
    {
      key: 'actions',
      label: '',
      render: (category) => (
        <div className="flex justify-end gap-2">
          <Button onClick={() => openEditModal(category)} size="sm" variant="secondary">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            disabled={deleteState.isDeleting}
            isLoading={deleteState.id === category.id && deleteState.isDeleting}
            onClick={() => handleDelete(category)}
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

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Tambah kategori
        </Button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-sm">
            <Input
              id="category-search"
              label="Cari Kategori"
              onChange={(event) => {
                setIsLoading(true)
                setPage(1)
                setSearch(event.target.value)
              }}
              placeholder="Bakso, minuman, paket..."
              value={search}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState label="Memuat kategori..." />
      ) : categories.length ? (
        <DataTable columns={columns} data={categories} />
      ) : (
        <EmptyState
          action={
            debouncedSearch ? (
              <Button
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                variant="secondary"
              >
                <Search className="h-4 w-4" />
                Reset Pencarian
              </Button>
            ) : (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Tambah kategori
              </Button>
            )
          }
          description={
            debouncedSearch
              ? 'Coba kata kunci lain atau reset pencarian.'
              : 'Kategori akan membantu mengelompokkan menu bakso, minuman, dan tambahan.'
          }
          title={debouncedSearch ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
        />
      )}

      {meta ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 px-4 py-3 text-sm text-slate-500 md:flex-row">
          <p>
            Halaman {meta.current_page} dari {meta.last_page} · {meta.total} kategori
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
        <CategoryFormModal
          category={formState.category}
          isOpen={formState.isOpen}
          key={formState.category?.id || 'create'}
          onClose={closeFormModal}
          onSaved={() => loadCategories({ page: 1 })}
        />
      ) : null}
    </div>
  )
}
