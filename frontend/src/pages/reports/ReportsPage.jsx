import { useEffect, useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { EmptyState } from '../../components/common/EmptyState'
import { Input } from '../../components/common/Input'
import { LoadingState } from '../../components/common/LoadingState'
import { Select } from '../../components/common/Select'
import { getApiMessage } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { reportService } from '../../services/reportService'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'

const paymentMethods = [
  { value: '', label: 'Semua Metode Pembayaran' },
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
    from: startOfMonth(),
    to: today(),
    payment_method: '',
  })
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
      const [sales, bestSellingMenus] = await Promise.all([
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
      from: startOfMonth(),
      to: today(),
      payment_method: '',
    }

    Promise.all([
      reportService.sales({ from: initialFilters.from, to: initialFilters.to }),
      reportService.bestSellingMenus({ from: initialFilters.from, to: initialFilters.to }),
    ])
      .then(([sales, bestSellingMenus]) => {
        if (!isMounted) {
          return
        }

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

  useAutoRefresh(async () => {
    try {
      const sharedParams = {
        payment_method: filters.payment_method || undefined,
      }
      const [sales, bestSellingMenus] = await Promise.all([
        reportService.sales({ from: filters.from, to: filters.to, ...sharedParams }),
        reportService.bestSellingMenus({ from: filters.from, to: filters.to, ...sharedParams }),
      ])
      setSalesReport(sales)
      setBestSelling(bestSellingMenus)
    } catch {
      // Keep the last report data during a background refresh failure.
    }
  })

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function exportToCsv() {
    if (!salesReport || !bestSelling) return

    let csvContent = "LAPORAN PENJUALAN\n"
    csvContent += `Rentang,${filters.from},sampai,${filters.to}\n`
    csvContent += `Total Revenue,${salesReport.total_revenue || 0}\n`
    csvContent += `Total Order,${salesReport.total_orders || 0}\n`
    csvContent += `AOV,${salesReport.average_order_value || 0}\n\n`

    csvContent += "BREAKDOWN PEMBAYARAN\n"
    csvContent += "Metode,Total Order,Total Revenue\n"
    if (salesReport.by_payment_method) {
      salesReport.by_payment_method.forEach(row => {
        csvContent += `${row.payment_method},${row.total_orders},${row.total_revenue}\n`
      })
    }
    csvContent += "\n"

    csvContent += "MENU TERLARIS\n"
    csvContent += "Menu,Terjual (porsi),Revenue\n"
    if (bestSelling.items) {
      bestSelling.items.forEach(row => {
        const menuName = `"${(row.menu_name || '').replace(/"/g, '""')}"`
        csvContent += `${menuName},${row.total_quantity},${row.total_revenue}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Laporan_Penjualan_${filters.from}_to_${filters.to}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

      <section className="rounded-2xl bg-white shadow-sm border border-slate-200/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-950">Filter Laporan</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
          <Input
            id="report-from"
            label="Dari Tanggal"
            onChange={(event) => updateFilter('from', event.target.value)}
            type="date"
            value={filters.from}
          />
          <Input
            id="report-to"
            label="Sampai Tanggal"
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
          <div className="flex gap-2">
            <Button className="flex-1 justify-center" onClick={() => loadReports()}>
              <BarChart3 className="h-4 w-4" />
              Terapkan
            </Button>
            <Button className="flex-1 justify-center" onClick={exportToCsv} variant="secondary">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}



      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr] items-stretch">
        <div className="flex flex-col h-full rounded-2xl bg-white shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50">
            <h3 className="font-bold text-slate-950">Breakdown Pembayaran</h3>
            <p className="text-xs text-slate-500 mt-1">Berdasarkan rentang waktu yang dipilih</p>
          </div>
          <div className="flex-1 p-6 space-y-4">
            {salesReport?.by_payment_method?.length ? (
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-4">
                  {salesReport.by_payment_method.map((row) => (
                    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm" key={row.payment_method}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold uppercase text-slate-950">{row.payment_method}</p>
                          <p className="text-sm font-medium text-slate-500">{row.total_orders} transaksi sukses</p>
                        </div>
                        <p className="text-lg font-bold tracking-tight text-slate-950">{formatRupiah(row.total_revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto border-t border-dashed border-slate-200 pt-4">
                  <div className="rounded-xl bg-indigo-50/50 p-4 border border-indigo-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold uppercase text-indigo-950">TOTAL KESELURUHAN</p>
                        <p className="text-sm font-medium text-indigo-700/80">{salesReport.total_orders} transaksi sukses</p>
                      </div>
                      <p className="text-xl font-bold tracking-tight text-indigo-600">{formatRupiah(salesReport.total_revenue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-slate-500">Belum ada transaksi pada rentang ini.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col h-full rounded-2xl bg-white shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50">
            <h3 className="font-bold text-slate-950">Menu Terlaris</h3>
            <p className="text-xs text-slate-500 mt-1">Berdasarkan porsi menu dari order yang sudah lunas</p>
          </div>
          <div className="flex-1">
            {bestSelling?.items?.length ? (
              <DataTable columns={columns} data={bestSelling.items} />
            ) : (
              <div className="p-8">
                <EmptyState
                  description="Data menu terlaris akan muncul saat ada pesanan yang lunas pada filter ini."
                  title="Belum ada data penjualan"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
