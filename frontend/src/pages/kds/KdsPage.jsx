import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChefHat, RefreshCcw, Wifi } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingState } from '../../components/common/LoadingState'
import { KdsOrderCard } from '../../components/kds/KdsOrderCard'
import { useRealtimeKds } from '../../hooks/useRealtimeKds'
import { useToast } from '../../hooks/useToast'
import { getApiMessage } from '../../lib/api'
import { kdsService } from '../../services/kdsService'

function upsertOrder(orders, nextOrder) {
  if (!nextOrder || nextOrder.order_status === 'selesai') {
    return orders.filter((order) => order.id !== nextOrder?.id)
  }

  const exists = orders.some((order) => order.id === nextOrder.id)

  if (!exists) {
    return [nextOrder, ...orders]
  }

  return orders.map((order) => (order.id === nextOrder.id ? nextOrder : order))
}

export function KdsPage() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [busyItemId, setBusyItemId] = useState(null)
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState(null)
  const { showToast } = useToast()

  async function loadOrders() {
    setIsLoading(true)
    setError('')

    try {
      setOrders(await kdsService.activeOrders())
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Antrean KDS gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    kdsService
      .activeOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(data)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Antrean KDS gagal dimuat.'))
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

  const handleOrderCreated = useCallback((payload) => {
    setOrders((current) => upsertOrder(current, payload.order))
    setLastRealtimeEvent('Order baru masuk')
  }, [])

  const handleOrderStatusUpdated = useCallback((payload) => {
    setOrders((current) => upsertOrder(current, payload.order))
    setLastRealtimeEvent('Status order diperbarui')
  }, [])

  const handleOrderItemStatusUpdated = useCallback((payload) => {
    setOrders((current) => upsertOrder(current, payload.order))
    setLastRealtimeEvent('Status item diperbarui')
  }, [])

  const handleOrderCompleted = useCallback((payload) => {
    setOrders((current) => current.filter((order) => order.id !== payload.order?.id))
    setLastRealtimeEvent('Order selesai')
  }, [])

  const realtimeHandlers = useMemo(
    () => ({
      onOrderCreated: handleOrderCreated,
      onOrderStatusUpdated: handleOrderStatusUpdated,
      onOrderItemStatusUpdated: handleOrderItemStatusUpdated,
      onOrderCompleted: handleOrderCompleted,
    }),
    [
      handleOrderCompleted,
      handleOrderCreated,
      handleOrderItemStatusUpdated,
      handleOrderStatusUpdated,
    ],
  )

  useRealtimeKds(realtimeHandlers)

  async function updateItemStatus(item, nextStatus) {
    setBusyItemId(item.id)
    setError('')

    try {
      const updatedItem = await kdsService.updateItemStatus(item.id, nextStatus)

      setOrders((current) =>
        upsertOrder(
          current,
          updatedItem.order
            ? {
                ...updatedItem.order,
                items:
                  current
                    .find((order) => order.id === updatedItem.order.id)
                    ?.items?.map((currentItem) =>
                      currentItem.id === updatedItem.id ? updatedItem : currentItem,
                    ) || [],
              }
            : null,
        ),
      )

      await loadOrders()
      showToast({
        title: 'Status item diperbarui',
        description: `Item sekarang ${nextStatus}.`,
        tone: 'success',
      })
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Status item gagal diperbarui.'))
    } finally {
      setBusyItemId(null)
    }
  }

  const totalItems = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0)
  const cookedItems = orders.reduce(
    (sum, order) => sum + (order.items?.filter((item) => item.item_status === 'selesai').length || 0),
    0,
  )

  if (isLoading) {
    return <LoadingState label="Memuat antrean dapur..." />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone="warning">Kitchen Display</Badge>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">KDS live</h2>
          <p className="mt-2 text-sm text-slate-500">
            Antrean order aktif untuk dapur. Update status item saat mulai dimasak atau selesai.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">
            <Wifi className="mr-1 h-3.5 w-3.5" />
            {lastRealtimeEvent || 'Realtime siap'}
          </Badge>
          <Button onClick={loadOrders} variant="secondary">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Order aktif</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Item selesai</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {cookedItems}/{totalItems}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Perlu dikerjakan</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{totalItems - cookedItems}</p>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {orders.length ? (
        <section className="grid gap-4 2xl:grid-cols-2">
          {orders.map((order) => (
            <KdsOrderCard
              busyItemId={busyItemId}
              key={order.id}
              onUpdateItemStatus={updateItemStatus}
              order={order}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          description="Order pending atau diproses akan muncul otomatis di layar ini."
          title="Tidak ada antrean dapur"
          action={
            <Button onClick={loadOrders} variant="secondary">
              <ChefHat className="h-4 w-4" />
              Cek antrean
            </Button>
          }
        />
      )}
    </div>
  )
}
