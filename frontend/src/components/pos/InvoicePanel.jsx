import { Printer } from 'lucide-react'
import { Button } from '../common/Button'
import { formatRupiah } from '../../lib/currency'

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
    <section className="print-area mx-auto w-full max-w-sm rounded-2xl bg-white p-6 text-slate-950 shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-950">Bakso Istigfar Mang Dadang</h2>
        <p className="mt-1 text-sm text-slate-500">Jl. Raya Bakso No. 88, Jakarta</p>
        <p className="text-sm text-slate-500">Telp: 0812-3456-7890</p>
      </div>

      <div className="my-4 border-b-2 border-dashed border-slate-200 print:border-black"></div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-y-3 text-sm text-slate-950">
        <div>
          <p className="text-xs text-slate-500">No. Order</p>
          <p className="font-semibold">{String(order.id).padStart(4, '0')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Tanggal</p>
          <p className="font-semibold">{formatDateTime(order.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Kasir</p>
          <p className="font-semibold">{order.user?.name || 'Customer QR'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Meja</p>
          <p className="font-semibold">{order.table?.table_number || '-'}</p>
        </div>
      </div>

      <div className="my-4 border-b-2 border-dashed border-slate-200 print:border-black"></div>

      {/* Items */}
      <div className="space-y-3">
        {(order.items || []).map((item) => (
          <div key={item.id} className="text-sm text-slate-950">
            <p className="font-semibold">{item.menu?.name || `Menu #${item.menu_id}`}</p>
            <div className="flex justify-between">
              <p className="text-slate-500">
                {item.quantity} x {formatRupiah(item.price)}
              </p>
              <p className="font-semibold">{formatRupiah(item.subtotal || item.price * item.quantity)}</p>
            </div>
            {item.notes && <p className="mt-0.5 text-xs text-slate-500">Catatan: {item.notes}</p>}
          </div>
        ))}
      </div>

      <div className="my-4 border-b-2 border-dashed border-slate-200 print:border-black"></div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-950">TOTAL</p>
        <p className="text-xl font-bold text-slate-950">{formatRupiah(order.total_amount)}</p>
      </div>

      <div className="my-4 border-b-2 border-dashed border-slate-200 print:border-black"></div>

      {/* Payment Info */}
      <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-950">
        <div>
          <p className="text-xs text-slate-500">Status Pembayaran</p>
          <p className="font-semibold">{order.payment_status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Metode Pembayaran</p>
          <p className="font-semibold uppercase">{order.payment_method || '-'}</p>
        </div>
        {order.payment_method === 'tunai' && order.cash_amount != null && (
          <>
            <div className="col-span-2 my-2 border-b border-dashed border-slate-200 print:border-black"></div>
            <div>
              <p className="text-xs text-slate-500">Tunai</p>
              <p className="font-semibold">{formatRupiah(order.cash_amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Kembalian</p>
              <p className="font-semibold">{formatRupiah(order.change_amount)}</p>
            </div>
          </>
        )}
      </div>

      <div className="my-4 border-b-2 border-dashed border-slate-200 print:border-black"></div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-500">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Silakan datang kembali.</p>
      </div>

      {/* Print Button */}
      {showPrint ? (
        <div className="mt-8 text-center print:hidden">
          <Button onClick={() => window.print()} className="w-full justify-center">
            <Printer className="mr-2 h-4 w-4" />
            Cetak Setruk
          </Button>
        </div>
      ) : null}
    </section>
  )
}
