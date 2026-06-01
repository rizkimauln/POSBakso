import { useEffect, useState } from 'react'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { EmptyState } from '../../components/common/EmptyState'
import { Input } from '../../components/common/Input'
import { LoadingState } from '../../components/common/LoadingState'
import { Select } from '../../components/common/Select'
import { useDebounce } from '../../hooks/useDebounce'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { getApiMessage } from '../../lib/api'
import { userService } from '../../services/userService'
import { UserFormModal } from './UserFormModal'

const roleTone = {
  admin: 'danger',
  kasir: 'info',
}

export function UserListPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ search: '', role: '' })
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState({ isOpen: false, user: null })
  const [busyId, setBusyId] = useState(null)
  const debouncedSearch = useDebounce(filters.search, 350)
  const { showToast } = useToast()

  async function loadUsers(options = {}) {
    setIsLoading(true)
    setError('')

    try {
      const response = await userService.list({
        page: options.page || page,
        per_page: 10,
        search: options.search ?? debouncedSearch,
        role: options.role ?? filters.role,
      })

      setUsers(response.data || [])
      setMeta(response.meta || null)
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Data user gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    userService
      .list({ page, per_page: 10, search: debouncedSearch, role: filters.role })
      .then((response) => {
        if (!isMounted) {
          return
        }

        setUsers(response.data || [])
        setMeta(response.meta || null)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Data user gagal dimuat.'))
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
  }, [debouncedSearch, filters.role, page])

  useAutoRefresh(async () => {
    try {
      const response = await userService.list({
        page,
        per_page: 10,
        search: debouncedSearch,
        role: filters.role,
      })
      setUsers(response.data || [])
      setMeta(response.meta || null)
    } catch {
      // Keep the last user list during a background refresh failure.
    }
  })

  function updateFilter(name, value) {
    setIsLoading(true)
    setPage(1)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setFormState({ isOpen: true, user: null })
  }

  function openEditModal(user) {
    setFormState({ isOpen: true, user })
  }

  function closeFormModal() {
    setFormState({ isOpen: false, user: null })
  }

  async function handleDelete(user) {
    const isConfirmed = window.confirm(`Hapus user "${user.name}"?`)

    if (!isConfirmed) {
      return
    }

    setBusyId(user.id)
    setError('')

    try {
      await userService.remove(user.id)
      await loadUsers()
      showToast({ title: 'User dihapus', tone: 'success' })
    } catch (requestError) {
      setError(getApiMessage(requestError, 'User gagal dihapus.'))
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (user) => (
        <div>
          <p className="font-semibold text-slate-950">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => <Badge tone={roleTone[user.role] || 'default'}>{user.role}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Dibuat',
      render: (user) =>
        user.created_at
          ? new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(user.created_at))
          : '-',
    },
    {
      key: 'actions',
      label: '',
      render: (user) => (
        <div className="flex justify-end gap-2">
          <Button onClick={() => openEditModal(user)} size="sm" variant="secondary">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            disabled={busyId === user.id || currentUser?.id === user.id}
            isLoading={busyId === user.id}
            onClick={() => handleDelete(user)}
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

  const hasActiveFilter = filters.search || filters.role

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Tambah user
        </Button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-end">
          <Input
            id="user-search"
            label="Cari Pengguna"
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Nama atau email..."
            value={filters.search}
          />
          <Select
            id="user-role-filter"
            label="Role"
            onChange={(event) => updateFilter('role', event.target.value)}
            value={filters.role}
          >
            <option value="">Semua Peran</option>
            <option value="admin">Admin</option>
            <option value="kasir">Kasir</option>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState label="Memuat user..." />
      ) : users.length ? (
        <DataTable columns={columns} data={users} />
      ) : (
        <EmptyState
          action={
            hasActiveFilter ? (
              <Button
                onClick={() => {
                  setIsLoading(true)
                  setPage(1)
                  setFilters({ search: '', role: '' })
                }}
                variant="secondary"
              >
                <Search className="h-4 w-4" />
                Reset Filter
              </Button>
            ) : (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Tambah user
              </Button>
            )
          }
          description={
            hasActiveFilter ? 'Coba kata kunci atau role lain.' : 'Tambahkan akun kasir baru.'
          }
          title={hasActiveFilter ? 'User tidak ditemukan' : 'Belum ada user'}
        />
      )}

      {meta ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 px-4 py-3 text-sm text-slate-500 md:flex-row">
          <p>
            Halaman {meta.current_page} dari {meta.last_page} · {meta.total} user
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
        <UserFormModal
          isOpen={formState.isOpen}
          key={formState.user?.id || 'create'}
          onClose={closeFormModal}
          onSaved={() => loadUsers({ page: 1 })}
          user={formState.user}
        />
      ) : null}
    </div>
  )
}
