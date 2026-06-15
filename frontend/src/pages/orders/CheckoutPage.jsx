import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Edit2, RefreshCcw, AlertCircle } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingState } from '../../components/common/LoadingState'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { InvoicePanel } from '../../components/pos/InvoicePanel'
import { useToast } from '../../hooks/useToast'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
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
  const [nominalUang, setNominalUang] = useState('')
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const autoSelectOrderId = searchParams.get('orderId')

  async function loadOrders({ showLoading = true } = {}) {
    if (showLoading) setIsLoading(true)
    setError('')

    try {
      const response = await orderService.list({
        order_status: 'diproses',
        per_page: 100,
      })
      const nextOrders = response.data || []
      setOrders(nextOrders)

      if (autoSelectOrderId && !selectedOrder) {
        const orderToSelect = nextOrders.find((o) => o.id === Number(autoSelectOrderId))
        if (orderToSelect) {
          selectOrder(orderToSelect)
        }
      } else if (selectedOrder && !nextOrders.some((order) => order.id === selectedOrder.id)) {
        setSelectedOrder((prev) => prev?.payment_status === 'lunas' ? prev : null)
      }
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Order checkout gagal dimuat.'))
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  useAutoRefresh(() => loadOrders({ showLoading: false }))

  useEffect(() => {
    let isMounted = true

    orderService
      .list({ order_status: 'diproses', per_page: 100 })
      .then((response) => {
        if (isMounted) {
          const fetchedOrders = response.data || []
          setOrders(fetchedOrders)
          if (autoSelectOrderId) {
            const orderToSelect = fetchedOrders.find((o) => o.id === Number(autoSelectOrderId))
            if (orderToSelect) selectOrder(orderToSelect)
          }
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
  }, [autoSelectOrderId])

  async function selectOrder(order) {
    setIsDetailLoading(true)
    setReceiptOrder(null)
    setNominalUang('')
    setError('')

    try {
      const invoice = await orderService.getInvoice(order.id)
      setSelectedOrder(invoice)
      if (invoice.payment_method) {
        setPaymentMethod(invoice.payment_method)
      }
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
      const paidOrder = await orderService.checkout(selectedOrder.id, paymentMethod, {
        cash_amount: paymentMethod === 'tunai' ? Number(nominalUang) : null
      })
      setReceiptOrder(paidOrder)
      setSelectedOrder(paidOrder)
      showToast({
        title: `Order ${String(paidOrder.id).padStart(4, '0')} lunas`,
        description: 'Pembayaran berhasil disimpan.',
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

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const tableNo = String(order.table?.table_number || '').toLowerCase()
    const customer = String(order.customer_name || '').toLowerCase()
    const orderId = String(order.id).toLowerCase()
    return tableNo.includes(q) || customer.includes(q) || orderId.includes(q)
  })

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-6 print:h-auto print:block">

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm print:hidden">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-1.5 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="mt-1 text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      ) : null}

      {receiptOrder ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm print:hidden">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-900">
                Order {String(receiptOrder.id).padStart(4, '0')} berhasil dibayar
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-700">
                Receipt siap dicetak atau dilihat kembali dari detail order.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr] flex-1 min-h-0 print:block print:grid-cols-none">

        {/* Left Column: Order List */}
        <section className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4 print:hidden print:overflow-visible">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200/60 p-4">
            <Input
              id="search-checkout-order"
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
                    {/* Visual indicator for selection */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                    )}

                    <div className="flex flex-col gap-3">
                      <p className={`font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-950'}`}>
                        Order #{String(order.id).padStart(4, '0')}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-medium text-slate-500">
                            {order.order_type === 'take_away' ? 'Bungkus / Take Away' : `Meja ${order.table?.table_number || '-'}`} <span className="mx-1.5 text-slate-300">•</span> {order.customer_name || 'Tanpa Nama'}
                          </p>
                          <div className="flex items-center gap-2">
                            {order.payment_status === 'lunas' ? (
                              <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">LUNAS</span>
                            ) : (
                              <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold text-red-700">BELUM BAYAR</span>
                            )}
                          </div>
                        </div>
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
                description="Semua order sudah lunas atau belum ada pesanan baru dari dapur."
                title="Tidak ada antrean"
              />
            </div>
          )}
        </section>

        {/* Right Column: Checkout Details */}
        <section className="flex flex-col h-full min-h-0 pr-2 pb-4 print:static print:block print:overflow-visible">
          {isDetailLoading ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-12 shadow-sm flex justify-center print:hidden">
              <LoadingState label="Memuat rincian invoice..." />
            </div>
          ) : selectedOrder ? (
            <>
              {!receiptOrder ? (
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 flex flex-col h-full print:hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">Rincian Pesanan</h3>
                      <p className="mt-0.5 text-sm font-medium text-slate-500">
                        Order {String(selectedOrder.id).padStart(4, '0')} <span className="mx-1.5 text-slate-300">•</span> {selectedOrder.order_type === 'take_away' ? 'Take Away' : `Meja ${selectedOrder.table?.table_number || '-'}`}
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate(`/app/orders?editId=${selectedOrder.id}`)}
                      size="sm"
                      variant="secondary"
                      className="bg-white hover:bg-slate-100"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Pesanan
                    </Button>
                  </div>

                  {/* Item List */}
                  <div className="px-6 py-5 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {(selectedOrder.items || []).map((item) => (
                        <div key={item.id} className="flex justify-between items-center group">
                          <div>
                            <p className="font-bold text-slate-950 group-hover:text-indigo-600 transition-colors">
                              {item.menu?.name || `Menu #${item.menu_id}`}
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-slate-500">
                              {item.quantity} × {formatRupiah(item.price)}
                            </p>
                          </div>
                          <p className="font-bold text-slate-950 tracking-tight">
                            {formatRupiah(item.subtotal || item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Form Wrapper */}
                  <div className="border-t border-slate-100 bg-slate-50/50 p-6 shrink-0">

                    {/* Total */}
                    {selectedOrder.payment_proof_url && (
                      <div className="flex items-center justify-between mb-4 px-1">
                        <p className="font-semibold text-slate-600">Bukti Bayar Pelanggan</p>
                        <a href={selectedOrder.payment_proof_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline">
                          Lihat Bukti 👁️
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <p className="font-semibold text-slate-600">Total Tagihan</p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatRupiah(selectedOrder.total_amount)}
                      </p>
                    </div>

                    {selectedOrder.payment_status === 'lunas' ? (
                      <div className="space-y-4 rounded-2xl bg-emerald-50 p-5 border border-emerald-200/80 shadow-sm text-center">
                        <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold mb-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Pesanan Ini Sudah Lunas
                        </div>
                        {selectedOrder.order_status !== 'selesai' && (
                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={async () => {
                              try {
                                setIsCheckingOut(true);
                                await orderService.updateStatus(selectedOrder.id, 'selesai');
                                showToast({ title: 'Pesanan Selesai', description: 'Pesanan telah diselesaikan dan dihapus dari antrean.', tone: 'success' });
                                setReceiptOrder(selectedOrder);
                                setSelectedOrder(null);
                                await loadOrders();
                              } catch (e) {
                                setError('Gagal menyelesaikan pesanan.');
                              } finally {
                                setIsCheckingOut(false);
                              }
                            }}
                            isLoading={isCheckingOut}
                          >
                            Tandai Pesanan Selesai
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <Select
                              error={fieldErrors.payment_method?.[0]}
                              id="payment-method"
                              label="Metode Pembayaran"
                              onChange={(event) => {
                                setPaymentMethod(event.target.value)
                                setNominalUang('')
                              }}
                              value={paymentMethod}
                            >
                              {paymentMethods.map((method) => (
                                <option key={method.value} value={method.value}>
                                  {method.label}
                                </option>
                              ))}
                            </Select>
                          </div>

                          {paymentMethod === 'tunai' && (
                            <div className="flex-1">
                              <Input
                                id="nominal-uang"
                                label="Uang Diterima (Rp)"
                                onChange={(e) => setNominalUang(e.target.value)}
                                placeholder="Masukkan jumlah"
                                type="number"
                                value={nominalUang}
                              />
                            </div>
                          )}

                          <Button
                            className="px-8 py-2.5 shrink-0"
                            isLoading={isCheckingOut}
                            onClick={checkoutOrder}
                            disabled={paymentMethod === 'tunai' && (Number(nominalUang) < selectedOrder.total_amount)}
                          >
                            Proses Bayar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative print:static">
                  <div className="absolute right-0 top-0 mt-4 mr-4 print:hidden z-10">
                    <Button onClick={() => {
                      setReceiptOrder(null);
                      setSelectedOrder(null);
                    }} variant="secondary" size="sm" className="bg-white hover:bg-slate-50 border-slate-200">
                      Tutup Receipt
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
                    <InvoicePanel order={receiptOrder} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
              <EmptyState
                description="Pilih salah satu order di sebelah kiri untuk melihat detail invoice dan memproses pembayaran."
                title="Pilih order checkout"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
