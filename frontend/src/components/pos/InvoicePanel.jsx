import { Printer } from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { formatRupiah } from '../../lib/currency'

const orderStatusLabel = {
  pending: 'Pending',
  diproses: 'Diproses',
  selesai: 'Selesai',
}

const paymentStatusLabel = {
  belum_lunas: 'Belum lunas',
  lunas: 'Lunas',
}

const paymentMethodLabel = {
  tunai: 'Tunai',
  qris: 'QRIS',
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function InvoicePanel({ order, showPrint = true }) {
  if (!order) {
    return null
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 print:border-0 print:p-0">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-start print:border-slate-300">
        <div>
          <p className="text-sm font-semibold uppercase text-red-700">Invoice</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Order #{order.id}</h2>
          <p className="mt-1 text-sm text-slate-500">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Badge tone={order.order_status === 'selesai' ? 'success' : 'warning'}>
            {orderStatusLabel[order.order_status] || order.order_status}
          </Badge>
          <Badge tone={order.payment_status === 'lunas' ? 'success' : 'danger'}>
            {paymentStatusLabel[order.payment_status] || order.payment_status}
          </Badge>
          {showPrint ? (
            <Button className="print:hidden" onClick={() => window.print()} size="sm" variant="secondary">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 py-4 text-sm md:grid-cols-3 print:border-slate-300">
        <div>
          <p className="text-slate-500">Meja</p>
          <p className="mt-1 font-semibold text-slate-950">{order.table?.table_number || '-'}</p>
        </div>
        <div>
          <p className="text-slate-500">Kasir</p>
          <p className="mt-1 font-semibold text-slate-950">{order.user?.name || 'Customer QR'}</p>
        </div>
        <div>
          <p className="text-slate-500">Pembayaran</p>
          <p className="mt-1 font-semibold text-slate-950">
            {paymentMethodLabel[order.payment_method] || '-'}
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 print:divide-slate-300">
        {(order.items || []).map((item) => (
          <div className="grid gap-2 py-3 md:grid-cols-[1fr_auto] md:items-start" key={item.id}>
            <div>
              <p className="font-semibold text-slate-950">
                {item.quantity}x {item.menu?.name || `Menu #${item.menu_id}`}
              </p>
              {item.notes ? <p className="mt-1 text-sm text-slate-500">{item.notes}</p> : null}
              <p className="mt-1 text-xs text-slate-400">{formatRupiah(item.price)} / item</p>
            </div>
            <p className="font-semibold text-slate-950 md:text-right">
              {formatRupiah(item.subtotal || item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-4 print:border-slate-300">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500">Total</p>
          <p className="text-3xl font-bold text-slate-950">{formatRupiah(order.total_amount)}</p>
        </div>
      </div>
    </section>
  )
}
