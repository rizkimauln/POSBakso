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

const statusLabel = {
  belum_lunas: 'Belum Lunas',
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


  const rememberedQrToken = customerService.getRememberedQrToken()

  return (
    <div className="min-h-screen space-y-4 p-4 bg-slate-50">
      <header className="rounded-xl bg-white p-4 shadow-sm flex flex-col items-center text-center">
        <h1 className="text-xl font-bold text-slate-950">Order {String(order.id).padStart(4, '0')}</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Meja {order.table?.table_number || '-'} - {formatTime(order.created_at)}
        </p>

        <p className="mt-3 text-xs text-slate-500">
          {lastRealtimeEvent || 'Pesanan Sedang di proses mohon ditunggu'}
        </p>
      </header>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-950">Item order</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {(order.items || []).map((item) => (
            <div className="py-3" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-bold text-slate-950">
                    {item.menu?.name || `Menu #${item.menu_id}`}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {item.quantity} × {formatRupiah(item.price)}
                  </p>
                  {item.notes ? <p className="mt-1 text-xs text-slate-400 italic">Catatan: {item.notes}</p> : null}
                </div>
                <p className="font-bold tracking-tight text-slate-950">
                  {formatRupiah(item.subtotal || item.price * item.quantity)}
                </p>
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-sm font-semibold !text-white hover:bg-red-800 transition-colors shadow-sm focus-visible:outline-red-700"
          to={`/customer/tables/${rememberedQrToken}`}
        >
          <Home className="h-4 w-4 !text-white" />
          Kembali ke menu
        </Link>
      ) : null}
    </div>
  )
}
