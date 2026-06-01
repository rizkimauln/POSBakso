import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  RefreshCcw,
  Wallet,
  ShoppingBag,
  Trophy,
  Clock,
  ReceiptText
} from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { LoadingState } from '../../components/common/LoadingState'
import { formatRupiah } from '../../lib/currency'
import { getApiMessage } from '../../lib/api'
import { orderService } from '../../services/orderService'
import { reportService } from '../../services/reportService'
import { tableService } from '../../services/tableService'

const statusLabel = {
  kosong: 'Kosong',
  terisi: 'Terisi',
  pending: 'Pending',
  diproses: 'Diproses',
  selesai: 'Selesai',
  belum_lunas: 'Belum lunas',
  lunas: 'Lunas',
}

// Helper untuk warna status meja
const tableStatusColors = {
  kosong: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  terisi: 'bg-amber-50 text-amber-700 border-amber-200',
}

function formatTime(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function fetchDashboardData() {
    const [dailyReport, bestSelling, ordersResponse, tablesResponse, unpaidOrdersResponse] =
      await Promise.all([
        reportService.daily(),
        reportService.bestSellingMenus(),
        orderService.list({ per_page: 5 }),
        tableService.list({ per_page: 100 }),
        orderService.list({ payment_status: 'belum_lunas', per_page: 100 }),
      ])

    return {
      dailyReport,
      bestSellingItems: bestSelling.items || [],
      orders: ordersResponse.data || [],
      tables: tablesResponse.data || [],
      unpaidOrders: unpaidOrdersResponse.data || [],
    }
  }

  async function loadDashboard() {
    setIsLoading(true)
    setError('')

    try {
      setDashboard(await fetchDashboardData())
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Dashboard gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    fetchDashboardData()
      .then((data) => {
        if (isMounted) {
          setDashboard(data)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Dashboard gagal dimuat.'))
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

  const tableSummary = useMemo(() => {
    const summary = {
      kosong: 0,
      terisi: 0,
    }

    dashboard?.tables.forEach((table) => {
      // Hanya menghitung jika status meja ada di definisi summary (kosong / terisi)
      if (summary[table.status] !== undefined) {
        summary[table.status] += 1
      }
    })

    return summary
  }, [dashboard])

  if (isLoading) {
    return <LoadingState label="Memuat dashboard operasional..." />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-red-100 p-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-red-900">Dashboard belum bisa dimuat</h2>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <Button className="mt-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" onClick={loadDashboard}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Coba lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Top Stats Section: Penjualan & Status Meja & Tagihan */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Block 1: Penjualan Hari Ini */}
        <div className="flex h-full flex-col justify-center rounded-2xl bg-white p-6 shadow-sm border border-slate-200/60 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">Penjualan Hari Ini</p>
              <p className="text-4xl font-bold tracking-tight text-slate-950 truncate">
                {formatRupiah(dashboard.dailyReport.total_revenue)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Wallet className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Block 2: Status Meja */}
        <div className="flex h-full flex-col justify-center rounded-2xl bg-white p-6 shadow-sm border border-slate-200/60 transition-shadow hover:shadow-md">
          <h3 className="font-semibold text-slate-500 text-sm mb-4">Status Meja</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(tableSummary).map(([status, count]) => (
              <div
                className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-transform hover:-translate-y-0.5 ${tableStatusColors[status] || 'bg-slate-50 border-slate-200'}`}
                key={status}
              >
                <p className="text-3xl font-black">{count}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider opacity-80 text-center">
                  {statusLabel[status]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Block 3: Tagihan Terbuka (Menunggu Bayar) */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 p-6 text-white shadow-sm transition-shadow hover:shadow-md">
          <ReceiptText className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 opacity-10" />
          <div className="relative z-10 flex h-full flex-col justify-between text-center gap-4">
            <div className="flex flex-col items-center justify-center h-full flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-100">
                Menunggu Bayar
              </p>
              <p className="text-6xl font-bold tracking-tight text-white">
                {dashboard.unpaidOrders.length}
              </p>
            </div>
            <Link
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/25"
              to="/app/checkout"
            >
              Menu Pembayaran
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Grid: Pesanan Terbaru (Kiri) | Menu Terlaris (Kanan) */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr] items-stretch">

        {/* Left Column: Pesanan Terbaru */}
        <div className="flex h-full flex-col rounded-2xl bg-white shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950">Pesanan Terbaru</h3>
                <p className="text-xs text-slate-500 mt-0.5">Prioritas pantauan kasir dan dapur</p>
              </div>
            </div>
            <Link
              className="group flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              to="/app/orders"
            >
              Lihat semua
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {dashboard.orders.map((order) => (
              <div
                className="flex flex-col gap-4 px-6 py-4 hover:bg-slate-50 transition-colors sm:flex-row sm:items-center sm:justify-between"
                key={order.id}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm shrink-0">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">
                      Order {String(order.id).padStart(4, '0')} <span className="text-slate-300 mx-1">|</span> Meja {order.table?.table_number || '-'}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {formatTime(order.created_at)} · {order.user?.name || 'Customer QR'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-[2.75rem] sm:pl-0">
                  <Badge tone={order.payment_status === 'lunas' ? 'success' : 'danger'}>
                    {statusLabel[order.payment_status] || order.payment_status}
                  </Badge>
                  <p className="text-lg font-bold tracking-tight text-slate-950 min-w-[100px] text-right">
                    {formatRupiah(order.total_amount)}
                  </p>
                </div>
              </div>
            ))}

            {dashboard.orders.length === 0 && (
              <div className="py-16 text-center h-full flex flex-col items-center justify-center">
                <p className="text-slate-500">Belum ada pesanan hari ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Menu Terlaris */}
        <div className="flex h-full flex-col rounded-2xl bg-white shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950">Menu Terlaris</h3>
                <p className="text-xs text-slate-500 mt-0.5">Berdasarkan pesanan lunas</p>
              </div>
            </div>
          </div>

          {/* Daftar Menu Vertikal */}
          <div className="flex-1 p-5 flex flex-col gap-3">
            {dashboard.bestSellingItems.slice(0, 6).map((item, index) => {
              let badgeClass = "bg-slate-100 text-slate-600";
              if (index === 0) badgeClass = "bg-amber-100 text-amber-700 ring-1 ring-amber-300";
              else if (index === 1) badgeClass = "bg-slate-200 text-slate-700 ring-1 ring-slate-300";
              else if (index === 2) badgeClass = "bg-orange-100 text-orange-800 ring-1 ring-orange-300";

              return (
                <div
                  className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
                  key={item.menu_id}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-inner ${badgeClass}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold text-slate-950 group-hover:text-indigo-600 transition-colors">
                      {item.menu_name}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-500">{item.total_quantity} porsi terjual</p>
                  </div>
                  <p className="font-bold tracking-tight text-slate-900 shrink-0">
                    {formatRupiah(item.total_revenue)}
                  </p>
                </div>
              )
            })}

            {dashboard.bestSellingItems.length === 0 && (
              <div className="py-16 text-center h-full flex flex-col items-center justify-center">
                <p className="text-slate-500">Belum ada data penjualan.</p>
              </div>
            )}
          </div>
        </div>

      </section>
    </div>
  )
}