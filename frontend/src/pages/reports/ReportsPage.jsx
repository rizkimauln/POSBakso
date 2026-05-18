import { useEffect, useState } from 'react'
import { BarChart3, CalendarDays, CreditCard, RefreshCcw, TrendingUp } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { EmptyState } from '../../components/common/EmptyState'
import { Input } from '../../components/common/Input'
import { LoadingState } from '../../components/common/LoadingState'
import { Select } from '../../components/common/Select'
import { getApiMessage } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { reportService } from '../../services/reportService'

const paymentMethods = [
  { value: '', label: 'Semua metode' },
  { value: 'tunai', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function startOfMonth() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().slice(0, 10)
}

export function ReportsPage() {
  const [filters, setFilters] = useState({
    date: today(),
    from: startOfMonth(),
    to: today(),
    payment_method: '',
  })
  const [dailyReport, setDailyReport] = useState(null)
  const [salesReport, setSalesReport] = useState(null)
  const [bestSelling, setBestSelling] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadReports(nextFilters = filters) {
    setIsLoading(true)
    setError('')

    try {
      const sharedParams = {
        payment_method: nextFilters.payment_method || undefined,
      }
      const [daily, sales, bestSellingMenus] = await Promise.all([
        reportService.daily({ date: nextFilters.date, ...sharedParams }),
        reportService.sales({
          from: nextFilters.from,
          to: nextFilters.to,
          ...sharedParams,
        }),
        reportService.bestSellingMenus({
          from: nextFilters.from,
          to: nextFilters.to,
          ...sharedParams,
        }),
      ])

      setDailyReport(daily)
      setSalesReport(sales)
      setBestSelling(bestSellingMenus)
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Laporan gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const initialFilters = {
      date: today(),
      from: startOfMonth(),
      to: today(),
      payment_method: '',
    }

    Promise.all([
      reportService.daily({ date: initialFilters.date }),
      reportService.sales({ from: initialFilters.from, to: initialFilters.to }),
      reportService.bestSellingMenus({ from: initialFilters.from, to: initialFilters.to }),
    ])
      .then(([daily, sales, bestSellingMenus]) => {
        if (!isMounted) {
          return
        }

        setDailyReport(daily)
        setSalesReport(sales)
        setBestSelling(bestSellingMenus)
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Laporan gagal dimuat.'))
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
  }, [])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const columns = [
    {
      key: 'menu_name',
      label: 'Menu',
      render: (item) => <span className="font-semibold text-slate-950">{item.menu_name}</span>,
    },
    {
      key: 'total_quantity',
      label: 'Terjual',
      render: (item) => `${item.total_quantity} porsi`,
    },
    {
      key: 'total_revenue',
      label: 'Revenue',
      render: (item) => <span className="font-semibold">{formatRupiah(item.total_revenue)}</span>,
    },
  ]

  if (isLoading) {
    return <LoadingState label="Memuat laporan..." />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone="danger">Reports</Badge>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">Laporan penjualan</h2>
          <p className="mt-2 text-sm text-slate-500">
            Pantau pendapatan harian, ringkasan rentang tanggal, dan menu terlaris.
          </p>
        </div>
        <Button onClick={() => loadReports()} variant="secondary">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_180px_180px_180px_auto] xl:items-end">
          <Input
            id="report-date"
            label="Tanggal harian"
            onChange={(event) => updateFilter('date', event.target.value)}
            type="date"
            value={filters.date}
          />
          <Input
            id="report-from"
            label="Dari"
            onChange={(event) => updateFilter('from', event.target.value)}
            type="date"
            value={filters.from}
          />
          <Input
            id="report-to"
            label="Sampai"
            onChange={(event) => updateFilter('to', event.target.value)}
            type="date"
            value={filters.to}
          />
          <Select
            id="report-payment"
            label="Pembayaran"
            onChange={(event) => updateFilter('payment_method', event.target.value)}
            value={filters.payment_method}
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
          <Button onClick={() => loadReports()}>
            <BarChart3 className="h-4 w-4" />
            Terapkan
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <Badge tone="danger">Harian</Badge>
            <CalendarDays className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-950">
            {formatRupiah(dailyReport?.total_revenue)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{dailyReport?.total_orders || 0} order</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <Badge tone="info">Rentang</Badge>
            <TrendingUp className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-950">
            {formatRupiah(salesReport?.total_revenue)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{salesReport?.total_orders || 0} order</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <Badge tone="success">AOV</Badge>
            <CreditCard className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-950">
            {formatRupiah(salesReport?.average_order_value)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Rata-rata order</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <Badge tone="warning">Top menu</Badge>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-950">
            {bestSelling?.items?.[0]?.menu_name || '-'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {bestSelling?.items?.[0]?.total_quantity || 0} porsi
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-950">Breakdown pembayaran</h3>
          <div className="mt-4 space-y-3">
            {salesReport?.by_payment_method?.length ? (
              salesReport.by_payment_method.map((row) => (
                <div className="rounded-lg bg-slate-50 p-4" key={row.payment_method}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold uppercase text-slate-950">{row.payment_method}</p>
                      <p className="text-sm text-slate-500">{row.total_orders} order</p>
                    </div>
                    <p className="font-bold text-slate-950">{formatRupiah(row.total_revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                Belum ada pembayaran pada rentang ini.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-950">Menu terlaris</h3>
            <p className="mt-1 text-sm text-slate-500">
              Berdasarkan quantity menu dari order lunas.
            </p>
          </div>
          {bestSelling?.items?.length ? (
            <DataTable columns={columns} data={bestSelling.items} />
          ) : (
            <EmptyState
              description="Menu terlaris akan muncul saat ada order lunas pada filter ini."
              title="Belum ada menu terlaris"
            />
          )}
        </div>
      </section>
    </div>
  )
}
