import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  ChefHat,
  ClipboardList,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
  Utensils,
} from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { LoadingState } from '../../components/common/LoadingState'
import { formatRupiah } from '../../lib/currency'
import { getApiMessage } from '../../lib/api'
import { kdsService } from '../../services/kdsService'
import { orderService } from '../../services/orderService'
import { reportService } from '../../services/reportService'
import { tableService } from '../../services/tableService'

const statusLabel = {
  kosong: 'Kosong',
  terisi: 'Terisi',
  menunggu_bayar: 'Menunggu bayar',
  pending: 'Pending',
  diproses: 'Diproses',
  selesai: 'Selesai',
  belum_lunas: 'Belum lunas',
  lunas: 'Lunas',
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
    const [dailyReport, bestSelling, kdsOrders, ordersResponse, tablesResponse] =
      await Promise.all([
        reportService.daily(),
        reportService.bestSellingMenus(),
        kdsService.activeOrders(),
        orderService.list({ per_page: 5 }),
        tableService.list({ per_page: 100 }),
      ])

    return {
      dailyReport,
      bestSellingItems: bestSelling.items || [],
      kdsOrders,
      orders: ordersResponse.data || [],
      tables: tablesResponse.data || [],
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
      menunggu_bayar: 0,
    }

    dashboard?.tables.forEach((table) => {
      summary[table.status] = (summary[table.status] || 0) + 1
    })

    return summary
  }, [dashboard])

  const activeOrders = useMemo(
    () => dashboard?.orders.filter((order) => order.order_status !== 'selesai') || [],
    [dashboard],
  )

  const unpaidOrders = useMemo(
    () => dashboard?.orders.filter((order) => order.payment_status === 'belum_lunas') || [],
    [dashboard],
  )

  if (isLoading) {
    return <LoadingState label="Memuat dashboard operasional..." />
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-700" />
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Dashboard belum bisa dimuat</h2>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <Button className="mt-4" onClick={loadDashboard} variant="secondary">
              <RefreshCcw className="h-4 w-4" />
              Coba lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Penjualan hari ini',
      value: formatRupiah(dashboard.dailyReport.total_revenue),
      caption: `${dashboard.dailyReport.total_orders} order lunas`,
      icon: ReceiptText,
      tone: 'danger',
    },
    {
      label: 'Order aktif',
      value: activeOrders.length,
      caption: 'Belum selesai',
      icon: ClipboardList,
      tone: 'info',
    },
    {
      label: 'Antrian dapur',
      value: dashboard.kdsOrders.length,
      caption: 'KDS aktif',
      icon: ChefHat,
      tone: 'warning',
    },
    {
      label: 'Meja kosong',
      value: tableSummary.kosong,
      caption: `${dashboard.tables.length} total meja`,
      icon: Utensils,
      tone: 'success',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone="danger">Live data</Badge>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">Dashboard operasional</h2>
          <p className="mt-2 text-sm text-slate-500">
            Ringkasan shift hari ini dari order, dapur, meja, checkout, dan laporan.
          </p>
        </div>
        <Button onClick={loadDashboard} variant="secondary">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article className="rounded-xl border border-slate-200 bg-white p-5" key={stat.label}>
            <div className="flex items-center justify-between">
              <Badge tone={stat.tone}>{stat.label}</Badge>
              <stat.icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-5 text-2xl font-bold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.caption}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-950">Order terbaru</h3>
              <p className="text-sm text-slate-500">Prioritas untuk kasir dan dapur.</p>
            </div>
            <Link className="text-sm font-semibold text-red-700 hover:text-red-800" to="/app/orders">
              Lihat semua
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.orders.map((order) => (
              <div className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto]" key={order.id}>
                <div>
                  <p className="font-semibold text-slate-950">
                    Order #{order.id} · Meja {order.table?.table_number || '-'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatTime(order.created_at)} · {order.user?.name || 'Customer QR'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Badge tone={order.order_status === 'selesai' ? 'success' : 'warning'}>
                    {statusLabel[order.order_status] || order.order_status}
                  </Badge>
                  <Badge tone={order.payment_status === 'lunas' ? 'success' : 'danger'}>
                    {statusLabel[order.payment_status] || order.payment_status}
                  </Badge>
                </div>
                <p className="font-semibold text-slate-950 md:text-right">
                  {formatRupiah(order.total_amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-950">Status meja</h3>
              <Utensils className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Object.entries(tableSummary).map(([status, count]) => (
                <div className="rounded-lg bg-slate-50 p-3" key={status}>
                  <p className="text-xs text-slate-500">{statusLabel[status]}</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-950">Tagihan terbuka</h3>
              <ReceiptText className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950">{unpaidOrders.length}</p>
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800"
              to="/app/checkout"
            >
              Menu checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-950">Menu terlaris</h3>
            <p className="text-sm text-slate-500">Berdasarkan order lunas bulan berjalan.</p>
          </div>
          <TrendingUp className="h-5 w-5 text-slate-400" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.bestSellingItems.slice(0, 6).map((item, index) => (
            <div className="rounded-lg bg-slate-50 p-4" key={item.menu_id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-red-700">#{index + 1}</p>
                  <p className="mt-1 font-semibold text-slate-950">{item.menu_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.total_quantity} porsi</p>
                </div>
                <p className="text-sm font-semibold text-slate-950">
                  {formatRupiah(item.total_revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
