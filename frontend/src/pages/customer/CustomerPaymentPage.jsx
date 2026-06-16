import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Download, ReceiptText } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { LoadingState } from '../../components/common/LoadingState'
import { EmptyState } from '../../components/common/EmptyState'
import { useToast } from '../../hooks/useToast'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { customerService } from '../../services/customerService'
import { settingService } from '../../services/settingService'

export function CustomerPaymentPage() {
  const { publicToken } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [order, setOrder] = useState(null)
  const [qrisImage, setQrisImage] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('tunai')
  const [paymentProof, setPaymentProof] = useState(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  useEffect(() => {
    let isMounted = true

    Promise.all([
      customerService.getOrder(publicToken),
      settingService.getPublicSettings()
    ])
      .then(([orderData, settingsData]) => {
        if (!isMounted) return
        setOrder(orderData)
        if (settingsData.qris_image_url) {
          setQrisImage(settingsData.qris_image_url)
        }
        
        if (orderData.payment_method) {
          // If already paid / payment method selected, redirect to status page
          navigate(`/customer/orders/${publicToken}`, { replace: true })
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Gagal memuat pesanan.'))
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [publicToken, navigate])

  async function submitPayment() {
    setIsSubmitting(true)
    setError('')
    setFieldError('')

    try {
      if (paymentMethod === 'qris' && !paymentProof) {
        setFieldError('Bukti pembayaran QRIS wajib diunggah.')
        setIsSubmitting(false)
        return
      }

      const payload = new FormData()
      payload.append('payment_method', paymentMethod)
      if (paymentMethod === 'qris' && paymentProof) {
        payload.append('payment_proof', paymentProof)
      }

      await customerService.submitPayment(publicToken, payload)

      showToast({
        title: 'Pembayaran Dikonfirmasi',
        description: 'Silahkan tunggu pesanan Anda diproses.',
        tone: 'success',
      })
      
      navigate(`/customer/orders/${publicToken}`, { replace: true })
    } catch (requestError) {
      const validationErrors = getValidationErrors(requestError)
      setFieldError(validationErrors.payment_method?.[0] || validationErrors.payment_proof?.[0] || '')
      setError(getApiMessage(requestError, 'Gagal memproses pembayaran.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
        <LoadingState label="Memuat rincian pesanan..." />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
        <EmptyState description={error || 'Pesanan tidak ditemukan'} title="Oops!" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-28 font-sans">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 pb-4 pt-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img alt="POS Bakso" className="h-8 w-auto object-contain" src="/images/Logo Red 1.png" />
              <span className="text-lg font-extrabold text-red-700 tracking-tight">POS Bakso</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Langkah 2 dari 2
              </p>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Pembayaran
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl p-4">
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-slate-100 pb-4">
            <p className="text-sm font-bold text-slate-500">Total Tagihan</p>
            <p className="text-3xl font-black tracking-tight text-slate-900">
              {formatRupiah(order.total_amount)}
            </p>
          </div>
          
          <div className="space-y-2 mb-4 border-b border-slate-100 pb-4">
            <p className="text-sm font-semibold text-slate-900">
              {order.customer_name} • {order.order_type === 'take_away' ? 'Take Away' : `Dine In (Meja ${order.table?.table_number})`}
            </p>
            <p className="text-xs text-slate-500">
              {order.items?.length || 0} item pesanan
            </p>
          </div>

          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{item.menu?.name}</p>
                  {item.notes && <p className="text-xs text-slate-500 italic mt-0.5">"{item.notes}"</p>}
                  <p className="text-xs font-medium text-slate-500 mt-1">{item.quantity} x {formatRupiah(item.price)}</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{formatRupiah(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-extrabold text-slate-900">Metode Pembayaran</h2>
          
          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('tunai')}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                paymentMethod === 'tunai'
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Bayar Tunai
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                paymentMethod === 'qris'
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              QRIS / Transfer
            </button>
          </div>

          {paymentMethod === 'tunai' && (
            <div className="mb-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-sm font-bold text-blue-900">Pembayaran Tunai</p>
              <p className="mt-1 text-xs text-blue-700">
                Silahkan menuju kasir untuk melakukan pembayaran. Pesanan Anda akan diproses setelah pembayaran dikonfirmasi.
              </p>
            </div>
          )}

          {paymentMethod === 'qris' && (
            <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="mb-2 text-sm font-bold text-slate-900">Scan QRIS ini untuk membayar</p>
              <div className="mx-auto mb-3 flex h-72 w-72 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white p-2">
                <img
                  src={qrisImage || "/images/qris-placeholder.png"}
                  alt="QRIS"
                  className={`h-full w-full object-contain ${!qrisImage && 'opacity-50'}`}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'block'
                  }}
                />
                <span className="hidden text-xs font-bold text-slate-400">QRIS</span>
              </div>
              
              {qrisImage && (
                <a
                  href={qrisImage}
                  download="QRIS_POS_Bakso"
                  target="_blank"
                  rel="noreferrer"
                  className="mx-auto mb-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download QRIS
                </a>
              )}
              
              <div className="mt-2 text-left">
                <label className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium transition hover:bg-slate-50">
                  {paymentProof ? (
                    <span className="flex items-center justify-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {paymentProof.name}
                    </span>
                  ) : (
                    <span className="text-slate-500">Pilih File Bukti Bayar / Screenshot</span>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
                        if (!validTypes.includes(file.type)) {
                          setFieldError('Mohon maaf, format file tidak didukung. Silakan ganti foto dengan format JPG atau PNG.')
                          setPaymentProof(null)
                          e.target.value = ''
                          return
                        }
                        setFieldError('')
                        setPaymentProof(file)
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {fieldError && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">
              {fieldError}
            </p>
          )}

          <div className="mt-6">
            <Button
              className="w-full rounded-full py-4 text-base font-bold shadow-lg"
              isLoading={isSubmitting}
              onClick={submitPayment}
              size="lg"
            >
              <ReceiptText className="mr-2 h-5 w-5" />
              Konfirmasi Pembayaran
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
