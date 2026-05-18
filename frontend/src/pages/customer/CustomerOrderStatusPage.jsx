import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ChefHat, Clock, Home, RefreshCcw, ReceiptText, Utensils } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingState } from '../../components/common/LoadingState'
import { useCustomerOrderChannel } from '../../hooks/useCustomerOrderChannel'
import { getApiMessage } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { customerService } from '../../services/customerService'

const orderSteps = [
  { value: 'pending', label: 'Diterima', icon: ReceiptText },
  { value: 'diproses', label: 'Dimasak', icon: ChefHat },
  { value: 'selesai', label: 'Selesai', icon: CheckCircle2 },
]

const statusIndex = {
  pending: 0,
  diproses: 1,
  selesai: 2,
}

const itemStatusLabel = {
  pending: 'Pending',
  dimasak: 'Dimasak',
  selesai: 'Selesai',
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

export function CustomerOrderStatusPage() {
  const { publicToken } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState('')

  async function loadOrder() {
    setIsLoading(true)
    setError('')

    try {
      setOrder(await customerService.getOrder(publicToken))
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Status order gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    customerService
      .getOrder(publicToken)
      .then((data) => {
        if (isMounted) {
          setOrder(data)
          customerService.rememberPublicToken(publicToken)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Status order gagal dimuat.'))
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
  }, [publicToken])

  const handleOrderStatusUpdated = useCallback((payload) => {
    if (payload.order) {
      setOrder(payload.order)
      setLastRealtimeEvent('Status order diperbarui')
    }
  }, [])

  const handleOrderItemStatusUpdated = useCallback((payload) => {
    if (payload.order) {
      setOrder(payload.order)
      setLastRealtimeEvent('Status item diperbarui')
    }
  }, [])

  const handleOrderCompleted = useCallback((payload) => {
    if (payload.order) {
      setOrder(payload.order)
      setLastRealtimeEvent('Order selesai')
    }
  }, [])

  const realtimeHandlers = useMemo(
    () => ({
      onOrderStatusUpdated: handleOrderStatusUpdated,
      onOrderItemStatusUpdated: handleOrderItemStatusUpdated,
      onOrderCompleted: handleOrderCompleted,
    }),
    [handleOrderCompleted, handleOrderItemStatusUpdated, handleOrderStatusUpdated],
  )

  useCustomerOrderChannel(publicToken, realtimeHandlers)

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingState label="Memuat status order..." />
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="p-4">
        <EmptyState
          action={
            <Button onClick={loadOrder} variant="secondary">
              <RefreshCcw className="h-4 w-4" />
              Coba lagi
            </Button>
          }
          description={error}
          title="Status order tidak ditemukan"
        />
      </div>
    )
  }

  const currentStep = statusIndex[order?.order_status] ?? 0
  const finishedItems = order?.items?.filter((item) => item.item_status === 'selesai').length || 0
  const totalItems = order?.items?.length || 0
  const rememberedQrToken = customerService.getRememberedQrToken()

  return (
    <div className="min-h-screen space-y-4 p-4">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge tone={order.order_status === 'selesai' ? 'success' : 'warning'}>
              {order.order_status}
            </Badge>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">Order #{order.id}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Utensils className="h-4 w-4" />
              Meja {order.table?.table_number || '-'} - {formatTime(order.created_at)}
            </p>
          </div>
          <Button onClick={loadOrder} size="sm" variant="secondary">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {orderSteps.map((step, index) => (
            <div
              className={[
                'rounded-xl border p-3 text-center',
                index <= currentStep
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-slate-200 bg-slate-50 text-slate-400',
              ].join(' ')}
              key={step.value}
            >
              <step.icon className="mx-auto h-5 w-5" />
              <p className="mt-2 text-xs font-semibold">{step.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Progress item</p>
            <p className="font-bold text-slate-950">
              {finishedItems}/{totalItems}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-red-700 transition-all"
              style={{ width: `${totalItems ? (finishedItems / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          {lastRealtimeEvent || 'Status terakhir dimuat dari server.'}
        </p>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Item order</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {(order.items || []).map((item) => (
            <div className="py-3" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">
                    {item.quantity}x {item.menu?.name || `Menu #${item.menu_id}`}
                  </p>
                  {item.notes ? <p className="mt-1 text-sm text-slate-500">{item.notes}</p> : null}
                </div>
                <Badge tone={item.item_status === 'selesai' ? 'success' : 'warning'}>
                  {itemStatusLabel[item.item_status] || item.item_status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-slate-500">Total</p>
          <p className="text-xl font-bold text-slate-950">{formatRupiah(order.total_amount)}</p>
        </div>
      </section>

      {rememberedQrToken ? (
        <Link
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          to={`/customer/tables/${rememberedQrToken}`}
        >
          <Home className="h-4 w-4" />
          Kembali ke menu
        </Link>
      ) : null}
    </div>
  )
}
