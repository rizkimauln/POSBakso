import { useEffect, useState } from 'react'
import {
  Copy,
  Edit,
  Link as LinkIcon,
  Plus,
  QrCode,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  Download,
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { EmptyState } from '../../components/common/EmptyState'
import { Input } from '../../components/common/Input'
import { LoadingState } from '../../components/common/LoadingState'
import { Select } from '../../components/common/Select'
import { tableStatuses } from '../../config/tableStatuses'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../hooks/useToast'
import { getApiMessage } from '../../lib/api'
import { tableService } from '../../services/tableService'
import { TableFormModal } from './TableFormModal'

const statusTone = {
  kosong: 'success',
  terisi: 'warning',
  menunggu_bayar: 'danger',
}

const statusLabel = Object.fromEntries(tableStatuses.map((status) => [status.value, status.label]))

function customerUrl(table) {
  return `${window.location.origin}/customer/tables/${table.qr_token}`
}

export function TableListPage() {
  const [tables, setTables] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState({ isOpen: false, table: null })
  const [busyId, setBusyId] = useState(null)
  const debouncedSearch = useDebounce(filters.search, 350)
  const { showToast } = useToast()

  async function loadTables(options = {}) {
    setIsLoading(true)
    setError('')

    try {
      const response = await tableService.list({
        page: options.page || page,
        per_page: 10,
        search: options.search ?? debouncedSearch,
        status: options.status ?? filters.status,
      })

      setTables(response.data || [])
      setMeta(response.meta || null)
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Data meja gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    tableService
      .list({ page, per_page: 10, search: debouncedSearch, status: filters.status })
      .then((response) => {
        if (!isMounted) {
          return
        }

        setTables(response.data || [])
        setMeta(response.meta || null)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Data meja gagal dimuat.'))
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
  }, [debouncedSearch, filters.status, page])

  function updateFilter(name, value) {
    setIsLoading(true)
    setPage(1)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setFormState({ isOpen: true, table: null })
  }

  function openEditModal(table) {
    setFormState({ isOpen: true, table })
  }

  function closeFormModal() {
    setFormState({ isOpen: false, table: null })
  }

  async function copyQrLink(table) {
    const url = customerUrl(table)

    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(table.id)
      showToast({ title: 'Link QR disalin', tone: 'success' })
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      setError('Link QR gagal disalin. Salin manual dari kolom URL.')
    }
  }

  async function handleStatusChange(table, status) {
    setBusyId(table.id)
    setError('')

    try {
      await tableService.updateStatus(table.id, status)
      await loadTables()
      showToast({ title: 'Status meja diperbarui', tone: 'success' })
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Status meja gagal diperbarui.'))
    } finally {
      setBusyId(null)
    }
  }

  const handleDownloadQr = (table) => {
    const canvas = document.getElementById(`qr-canvas-${table.id}`)
    if (canvas) {
      const url = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `QR-Meja-${table.table_number}.png`
      link.href = url
      link.click()
    }
  }

  async function handleRegenerateQr(table) {
    const isConfirmed = window.confirm(`Buat ulang QR token untuk meja ${table.table_number}?`)

    if (!isConfirmed) {
      return
    }

    setBusyId(table.id)
    setError('')

    try {
      await tableService.regenerateQr(table.id)
      await loadTables()
      showToast({ title: 'QR token dibuat ulang', tone: 'success' })
    } catch (requestError) {
      setError(getApiMessage(requestError, 'QR token gagal dibuat ulang.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(table) {
    const isConfirmed = window.confirm(`Hapus meja ${table.table_number}?`)

    if (!isConfirmed) {
      return
    }

    setBusyId(table.id)
    setError('')

    try {
      await tableService.remove(table.id)
      await loadTables()
      showToast({ title: 'Meja dihapus', tone: 'success' })
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Meja gagal dihapus.'))
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'table_number',
      label: 'Meja',
      render: (table) => (
        <div>
          <p className="font-semibold text-slate-950">Meja {table.table_number}</p>
          <p className="text-xs text-slate-500">ID #{table.id}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (table) => (
        <div className="space-y-2">
          <Badge tone={statusTone[table.status] || 'default'}>
            {statusLabel[table.status] || table.status}
          </Badge>
          <Select
            disabled={busyId === table.id}
            id={`status-${table.id}`}
            onChange={(event) => handleStatusChange(table, event.target.value)}
            value={table.status}
          >
            {tableStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
      ),
    },
    {
      key: 'qr',
      label: 'QR customer',
      render: (table) => (
        <div className="max-w-md space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <QrCode className="h-4 w-4" />
            <span className="truncate">{table.qr_token}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <LinkIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{customerUrl(table)}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => copyQrLink(table)} size="sm" variant="secondary">
              <Copy className="h-4 w-4" />
              {copiedId === table.id ? 'Tersalin' : 'Copy link'}
            </Button>
            <Button onClick={() => handleDownloadQr(table)} size="sm" variant="secondary">
              <Download className="h-4 w-4" />
              Download QR
            </Button>
            <div className="hidden">
              <QRCodeCanvas
                id={`qr-canvas-${table.id}`}
                includeMargin={true}
                level="H"
                size={300}
                value={customerUrl(table)}
              />
            </div>
          </div>
        </div>
      ),
    },

    {
      key: 'actions',
      label: '',
      render: (table) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            disabled={busyId === table.id}
            onClick={() => handleRegenerateQr(table)}
            size="sm"
            variant="secondary"
          >
            <RotateCcw className="h-4 w-4" />
            QR
          </Button>
          <Button onClick={() => openEditModal(table)} size="sm" variant="secondary">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            disabled={busyId === table.id}
            isLoading={busyId === table.id}
            onClick={() => handleDelete(table)}
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

  const hasActiveFilter = filters.search || filters.status

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Tambah meja
        </Button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-end">
          <Input
            id="table-search"
            label="Cari Meja"
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="M1, M2..."
            value={filters.search}
          />
          <Select
            id="table-status-filter"
            label="Status"
            onChange={(event) => updateFilter('status', event.target.value)}
            value={filters.status}
          >
            <option value="">Semua Status</option>
            {tableStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState label="Memuat meja..." />
      ) : tables.length ? (
        <DataTable columns={columns} data={tables} />
      ) : (
        <EmptyState
          action={
            hasActiveFilter ? (
              <Button
                onClick={() => {
                  setIsLoading(true)
                  setPage(1)
                  setFilters({ search: '', status: '' })
                }}
                variant="secondary"
              >
                <Search className="h-4 w-4" />
                Reset Filter
              </Button>
            ) : (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Tambah meja
              </Button>
            )
          }
          description={
            hasActiveFilter
              ? 'Coba kata kunci atau filter lain.'
              : 'Meja baru otomatis mendapat QR token.'
          }
          title={hasActiveFilter ? 'Meja tidak ditemukan' : 'Belum ada meja'}
        />
      )}

      {meta ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 px-4 py-3 text-sm text-slate-500 md:flex-row">
          <p>
            Halaman {meta.current_page} dari {meta.last_page} · {meta.total} meja
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
        <TableFormModal
          isOpen={formState.isOpen}
          key={formState.table?.id || 'create'}
          onClose={closeFormModal}
          onSaved={() => loadTables({ page: 1 })}
          table={formState.table}
        />
      ) : null}
    </div>
  )
}
