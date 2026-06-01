import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCcw, AlertCircle } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { LoadingState } from '../../components/common/LoadingState'
import { InvoicePanel } from '../../components/pos/InvoicePanel'
import { getApiMessage } from '../../lib/api'
import { orderService } from '../../services/orderService'

export function OrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function loadOrder() {
    setIsLoading(true)
    setError('')

    try {
      setOrder(await orderService.getInvoice(orderId))
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Detail order gagal dimuat.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    orderService
      .getInvoice(orderId)
      .then((data) => {
        if (isMounted) {
          setOrder(data)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiMessage(requestError, 'Detail order gagal dimuat.'))
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
  }, [orderId])

  if (isLoading) {
    return <LoadingState label="Memuat rincian invoice..." />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 print:p-0 print:m-0 print:max-w-none">

      {/* Header / Navigation Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200/60 transition-all hover:bg-slate-50 hover:text-indigo-600"
          to="/app/checkout"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Kembali ke Antrean
        </Link>
      </div>

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

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 print:border-0 print:shadow-none">
        <InvoicePanel order={order} />
      </div>
    </div>
  )
}