import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCcw } from 'lucide-react'
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
    return <LoadingState label="Memuat detail order..." />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col justify-between gap-3 print:hidden md:flex-row md:items-center">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600" to="/app/checkout">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke checkout
        </Link>
        <Button onClick={loadOrder} variant="secondary">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 print:hidden">
          {error}
        </div>
      ) : null}

      <InvoicePanel order={order} />
    </div>
  )
}
