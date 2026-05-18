import { useEffect, useState } from 'react'
import { CheckCircle2, CreditCard, RefreshCcw, Search } from 'lucide-react'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingState } from '../../components/common/LoadingState'
import { Select } from '../../components/common/Select'
import { InvoicePanel } from '../../components/pos/InvoicePanel'
import { useToast } from '../../hooks/useToast'
import { getApiMessage, getValidationErrors } from '../../lib/api'
import { formatRupiah } from '../../lib/currency'
import { orderService } from '../../services/orderService'

const paymentMethods = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
]

export function CheckoutPage() {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('tunai')
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const { showToast } = useToast()

  async function loadOrders() {
    setIsLoading(true)
    setError('')

    try {
      const response = await orderService.list({
        payment_status: 'belum_lunas',
        order_status: 'selesai',
        per_page: 100,
      })
      const nextOrders = response.data || []
      setOrders(nextOrders)

      if (selectedOrder && !nextOrders.some((order) => order.id === selectedOrder.id)) {
        setSelectedOrder(null)
      }
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Order checkout gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    orderService
      .list({ payment_status: 'belum_lunas', order_status: 'selesai', per_page: 100 })
      .then((response) => {
        if (isMounted) {
          setOrders(response.data || [])
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Order checkout gagal dimuat.'))
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

  async function selectOrder(order) {
    setIsDetailLoading(true)
    setReceiptOrder(null)
    setError('')

    try {
      setSelectedOrder(await orderService.getInvoice(order.id))
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Invoice order gagal dimuat.'))
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function checkoutOrder() {
    if (!selectedOrder) {
      return
    }

    setIsCheckingOut(true)
    setError('')
    setFieldErrors({})

    try {
      const paidOrder = await orderService.checkout(selectedOrder.id, paymentMethod)
      setReceiptOrder(paidOrder)
      setSelectedOrder(paidOrder)
      showToast({
        title: `Order #${paidOrder.id} lunas`,
        description: 'Receipt siap dicetak.',
        tone: 'success',
      })
      await loadOrders()
    } catch (requestError) {
      setFieldErrors(getValidationErrors(requestError))
      setError(getApiMessage(requestError, 'Checkout gagal diproses.'))
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (isLoading) {
    return <LoadingState label="Memuat checkout..." />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone="danger">Checkout</Badge>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">Checkout dan invoice</h2>
          <p className="mt-2 text-sm text-slate-500">
            Pilih order selesai yang belum lunas, verifikasi invoice, lalu proses pembayaran.
          </p>
        </div>
        <Button onClick={loadOrders} variant="secondary">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {receiptOrder ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div>
              <p className="font-semibold text-emerald-900">
                Order #{receiptOrder.id} berhasil checkout
              </p>
              <p className="text-sm text-emerald-700">
                Receipt siap dicetak atau dilihat kembali dari detail order.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        <section className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-950">Order belum lunas</h3>
            <p className="mt-1 text-sm text-slate-500">
              Hanya order selesai yang bisa diproses checkout.
            </p>
          </div>

          {orders.length ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <button
                  className={[
                    'w-full rounded-xl border bg-white p-4 text-left transition hover:border-red-200 hover:bg-red-50',
                    selectedOrder?.id === order.id ? 'border-red-300 bg-red-50' : 'border-slate-200',
                  ].join(' ')}
                  key={order.id}
                  onClick={() => selectOrder(order)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">Order #{order.id}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Meja {order.table?.table_number || '-'} · {order.user?.name || 'Customer QR'}
                      </p>
                    </div>
                    <Badge tone="warning">Belum lunas</Badge>
                  </div>
                  <p className="mt-4 text-xl font-bold text-slate-950">
                    {formatRupiah(order.total_amount)}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button onClick={loadOrders} variant="secondary">
                  <Search className="h-4 w-4" />
                  Cek ulang
                </Button>
              }
              description="Order akan muncul setelah status dapur selesai dan pembayaran belum lunas."
              title="Tidak ada order checkout"
            />
          )}
        </section>

        <section className="space-y-4">
          {isDetailLoading ? (
            <LoadingState label="Memuat invoice..." />
          ) : selectedOrder ? (
            <>
              <InvoicePanel order={selectedOrder} />

              {selectedOrder.payment_status === 'belum_lunas' ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 print:hidden">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <Select
                      error={fieldErrors.payment_method?.[0]}
                      id="payment-method"
                      label="Metode pembayaran"
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      value={paymentMethod}
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </Select>
                    <Button isLoading={isCheckingOut} onClick={checkoutOrder}>
                      <CreditCard className="h-4 w-4" />
                      Proses checkout
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              description="Pilih salah satu order di kiri untuk melihat invoice dan memproses pembayaran."
              title="Pilih order checkout"
            />
          )}
        </section>
      </div>
    </div>
  )
}
