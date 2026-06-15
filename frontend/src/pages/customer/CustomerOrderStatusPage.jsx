import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Home, RefreshCcw, Star, MessageSquare, Send } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingState } from '../../components/common/LoadingState'
import { useCustomerOrderChannel } from '../../hooks/useCustomerOrderChannel'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { getApiMessage } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { customerService } from '../../services/customerService'
import { useToast } from '../../hooks/useToast'

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
  const { showToast } = useToast()

  // Feedback Form State
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

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
  useAutoRefresh(async () => {
    try {
      setOrder(await customerService.getOrder(publicToken))
    } catch {
      // Keep the last known status while a background refresh fails.
    }
  })

  async function submitFeedback() {
    if (rating === 0) {
      showToast({ title: 'Rating Diperlukan', description: 'Silakan pilih bintang penilaian.', tone: 'danger' })
      return
    }

    setIsSubmittingFeedback(true)
    try {
      await customerService.submitReview({
        order_public_token: publicToken,
        customer_name: order.customer_name || 'Pelanggan',
        rating,
        comment,
      })
      setFeedbackSubmitted(true)
      showToast({ title: 'Terima kasih!', description: 'Ulasan Anda berhasil dikirim.', tone: 'success' })
    } catch (requestError) {
      showToast({ title: 'Gagal', description: getApiMessage(requestError, 'Gagal mengirim ulasan.'), tone: 'danger' })
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

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
  const isCompleted = order?.order_status === 'selesai' || order?.payment_status === 'lunas'

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 pb-4 pt-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img alt="POS Bakso" className="h-8 w-auto object-contain" src="/images/Logo Red 1.png" />
              <span className="text-lg font-extrabold text-red-700 tracking-tight">POS Bakso</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Status Pesanan
              </p>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Order #{String(order.id).padStart(4, '0')}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4 mt-2">
        <header className="rounded-2xl bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isCompleted ? <RefreshCcw className="h-8 w-8" /> : <RefreshCcw className="h-8 w-8 animate-spin" />}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order #{String(order.id).padStart(4, '0')}</h1>
          <p className="mt-1 font-medium text-slate-600">
            {order.order_type === 'take_away' ? 'Take Away' : `Meja ${order.table?.table_number || '-'}`} - {formatTime(order.created_at)}
          </p>

          <div className="mt-4 rounded-full bg-slate-100 px-4 py-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Status: <span className={isCompleted ? 'text-green-600' : 'text-red-600'}>
                {order.order_status === 'pending' ? 'Menunggu' : order.order_status === 'diproses' ? 'Diproses' : order.order_status === 'selesai' ? 'Selesai' : order.order_status}
              </span>
            </p>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4 tracking-tight">Detail Pesanan</h2>
          <div className="divide-y divide-slate-100">
            {(order.items || []).map((item) => (
              <div className="py-4" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">
                      {item.menu?.name || `Menu #${item.menu_id}`}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {item.quantity} × {formatRupiah(item.price)}
                    </p>
                    {item.notes ? <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600 italic">Catatan: {item.notes}</p> : null}
                  </div>
                  <p className="font-black tracking-tight text-slate-900">
                    {formatRupiah(item.subtotal || item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <p className="font-bold text-slate-500">Total Pembayaran</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{formatRupiah(order.total_amount)}</p>
          </div>
        </section>

        {/* Feedback Form Section */}
        {isCompleted && !feedbackSubmitted && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-red-100">
            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Bagaimana Pesanan Anda?</h2>
              <p className="text-sm text-slate-500 mt-1">Bantu kami menjadi lebih baik dengan memberikan ulasan.</p>
            </div>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110 focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-100 text-slate-200'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            <div className="relative mb-4">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <textarea
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-medium outline-none transition focus:border-red-400 focus:bg-white"
                placeholder="Ceritakan pengalaman Anda (opsional)..."
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
              />
            </div>

            <Button
              className="w-full rounded-full py-3 font-bold shadow-md"
              onClick={submitFeedback}
              isLoading={isSubmittingFeedback}
              disabled={rating === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              Kirim Ulasan
            </Button>
          </section>
        )}

        {feedbackSubmitted && (
          <section className="rounded-2xl bg-green-50 p-6 text-center shadow-sm ring-1 ring-green-100">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Star className="h-6 w-6 fill-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-800">Terima kasih atas ulasan Anda!</h3>
            <p className="mt-1 text-sm text-green-600">Ulasan Anda sangat berarti bagi kami.</p>
          </section>
        )}

        {rememberedQrToken && (
          <div className="pt-4">
            <Link
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-4 text-base font-bold text-white shadow-md transition hover:bg-red-800"
              to={`/customer/tables/${rememberedQrToken}`}
            >
              <span>Pesan Lagi</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
