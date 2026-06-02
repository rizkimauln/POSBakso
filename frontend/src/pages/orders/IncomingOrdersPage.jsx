import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Bell, BellRing, RefreshCcw, Play } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingState } from '../../components/common/LoadingState'
import { useToast } from '../../hooks/useToast'
import { getApiMessage } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { orderService } from '../../services/orderService'
import { getEcho } from '../../lib/echo'
import { Input } from '../../components/common/Input'

export function IncomingOrdersPage() {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState(
    () => window.Notification?.permission || 'unsupported',
  )
  const isPollingRef = useRef(false)
  const knownOrderIdsRef = useRef(null)
  const { showToast } = useToast()

  const playNotificationSound = useCallback(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    gain.gain.setValueAtTime(0.12, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.45)
  }, [])

  const notifyNewOrder = useCallback((order) => {
    const tableNumber = order.table?.table_number || '-'
    const customerName = order.customer_name || 'Tanpa nama'
    const description = `Meja ${tableNumber} - ${customerName}`

    showToast({
      title: 'Pesanan Baru Masuk!',
      description,
      tone: 'info',
    })
    playNotificationSound()

    if (window.Notification?.permission === 'granted') {
      new window.Notification('Pesanan baru masuk', {
        body: description,
        icon: '/images/Logo Red 1.png',
        tag: `order-${order.id}`,
      })
    }
  }, [playNotificationSound, showToast])

  const loadOrders = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true)
    }
    setError('')

    try {
      const response = await orderService.list({
        payment_status: 'belum_lunas',
        order_status: 'pending',
        per_page: 100,
      })
      const nextOrders = (response.data || []).reverse()
      const nextOrderIds = new Set(nextOrders.map((order) => order.id))

      if (knownOrderIdsRef.current) {
        nextOrders
          .filter((order) => !knownOrderIdsRef.current.has(order.id))
          .forEach(notifyNewOrder)
      }

      knownOrderIdsRef.current = nextOrderIds
      setOrders(nextOrders)
      setSelectedOrder((currentOrder) => (
        currentOrder && !nextOrders.some((order) => order.id === currentOrder.id)
          ? null
          : currentOrder
      ))
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Daftar pesanan gagal dimuat.'))
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [notifyNewOrder])

  useEffect(() => {
    let isMounted = true

    const initialLoadTimeout = window.setTimeout(() => {
      loadOrders()
    }, 0)

    const pollingInterval = window.setInterval(() => {
      if (isMounted && !document.hidden && !isPollingRef.current) {
        isPollingRef.current = true
        loadOrders({ showLoading: false }).finally(() => {
          isPollingRef.current = false
        })
      }
    }, 5000)

    const channel = getEcho().private('kds.orders')
    channel.listen('.order.created', (event) => {
      if (isMounted && event.order && event.order.order_status === 'pending') {
        setOrders(prev => {
          if (prev.find(o => o.id === event.order.id)) return prev
          return [...prev, event.order]
        })
        knownOrderIdsRef.current?.add(event.order.id)
        notifyNewOrder(event.order)
      }
    })

    return () => {
      window.clearTimeout(initialLoadTimeout)
      window.clearInterval(pollingInterval)
      getEcho().leave('private-kds.orders')
      isMounted = false
    }
  }, [loadOrders, notifyNewOrder])

  async function enableNotifications() {
    if (!window.Notification) {
      showToast({
        title: 'Notifikasi browser tidak tersedia',
        description: 'Gunakan browser modern seperti Chrome atau Edge.',
        tone: 'error',
      })
      return
    }

    const permission = await window.Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === 'granted') {
      playNotificationSound()
      showToast({
        title: 'Notifikasi pesanan aktif',
        description: 'Kasir akan menerima alert saat order baru masuk.',
        tone: 'success',
      })
    }
  }

  async function selectOrder(order) {
    setIsDetailLoading(true)
    setError('')

    try {
      setSelectedOrder(await orderService.show(order.id))
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Detail pesanan gagal dimuat.'))
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function processOrder() {
    if (!selectedOrder) return

    setIsProcessing(true)
    setError('')

    try {
      await orderService.updateStatus(selectedOrder.id, 'diproses')

      showToast({
        title: `Order ${String(selectedOrder.id).padStart(4, '0')} Diproses`,
        description: 'Pesanan telah diteruskan ke menu Pembayaran.',
        tone: 'success',
      })

      setSelectedOrder(null)
      await loadOrders()
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Gagal memproses pesanan.'))
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return <LoadingState label="Memuat antrean pesanan..." />
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const tableNo = String(order.table?.table_number || '').toLowerCase()
    const customer = String(order.customer_name || '').toLowerCase()
    const orderId = String(order.id).toLowerCase()
    return tableNo.includes(q) || customer.includes(q) || orderId.includes(q)
  })

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-6">

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-1.5 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="mt-1 text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr] flex-1 min-h-0">

        {/* Left Column: Order List */}
        <section className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Antrean pelanggan</p>
              <Button
                className="h-8 rounded-full px-3 text-xs"
                onClick={enableNotifications}
                variant={notificationPermission === 'granted' ? 'secondary' : 'primary'}
              >
                {notificationPermission === 'granted' ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                {notificationPermission === 'granted' ? 'Notifikasi aktif' : 'Aktifkan notifikasi'}
              </Button>
            </div>
            <Input
              id="search-incoming-order"
              placeholder="Cari meja atau nama pemesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredOrders.length ? (
            <div className="flex flex-col gap-3">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <button
                    className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 ${isSelected
                      ? 'border-indigo-300 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                      }`}
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    type="button"
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                    )}

                    <div className="flex flex-col gap-3">
                      <p className={`font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-950'}`}>
                        Order #{String(order.id).padStart(4, '0')}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                          Meja {order.table?.table_number || '-'} <span className="mx-1.5 text-slate-300">•</span> {order.customer_name || 'Tanpa Nama'}
                        </p>
                        <p className={`text-lg font-bold tracking-tight ${isSelected ? 'text-indigo-700' : 'text-slate-950'}`}>
                          {formatRupiah(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
              <EmptyState
                action={
                  <Button onClick={loadOrders} variant="secondary" className="mt-2">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Cek ulang
                  </Button>
                }
                description="Belum ada pesanan baru yang masuk dari QR pelanggan saat ini."
                title="Antrean Kosong"
              />
            </div>
          )}
        </section>

        {/* Right Column: Order Details */}
        <section className="flex flex-col h-full min-h-0 pr-2 pb-4">
          {isDetailLoading ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-12 shadow-sm flex justify-center">
              <LoadingState label="Memuat rincian pesanan..." />
            </div>
          ) : selectedOrder ? (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 flex flex-col h-full">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Detail Pesanan Baru</h3>
                  <p className="mt-0.5 text-sm font-medium text-slate-500">
                    Kode: #{String(selectedOrder.id).padStart(4, '0')} <span className="mx-1.5 text-slate-300">•</span> Meja {selectedOrder.table?.table_number || '-'} <span className="mx-1.5 text-slate-300">•</span> A.n. {selectedOrder.customer_name || 'Tanpa Nama'}
                  </p>
                </div>
              </div>

              {/* Item List */}
              <div className="px-6 py-5 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {(selectedOrder.order_items || selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex justify-between items-start group border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-slate-950 group-hover:text-indigo-600 transition-colors">
                          {item.menu?.name || `Menu #${item.menu_id}`}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-500">
                          {item.quantity} × {formatRupiah(item.price)}
                        </p>
                        {item.notes && (
                          <div className="mt-2 inline-flex rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                            Catatan: {item.notes}
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-slate-950 tracking-tight">
                        {formatRupiah(item.subtotal || item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Wrapper */}
              <div className="border-t border-slate-100 bg-slate-50/50 p-6 shrink-0">
                <div className="flex items-center justify-between mb-4 px-1">
                  <p className="font-semibold text-slate-600">Total Tagihan</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatRupiah(selectedOrder.total_amount)}
                  </p>
                </div>

                <Button
                  className="w-full justify-center py-4 text-base"
                  isLoading={isProcessing}
                  onClick={processOrder}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Terima & Proses Pesanan
                </Button>
                <p className="text-xs text-center text-slate-500 mt-3">
                  Setelah diproses, pesanan akan diteruskan ke menu Pembayaran.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
              <EmptyState
                description="Pilih salah satu pesanan baru di sebelah kiri untuk melihat detail pesanan dari pelanggan."
                title="Pilih Pesanan Masuk"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
