import { Clock, ReceiptText, UserRound, Utensils } from 'lucide-react'
import { Badge } from '../common/Badge'
import { KdsItemRow } from './KdsItemRow'

const orderStatus = {
  pending: { label: 'Pending', tone: 'warning' },
  diproses: { label: 'Diproses', tone: 'info' },
  selesai: { label: 'Selesai', tone: 'success' },
}

function formatTime(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function KdsOrderCard({ busyItemId, onUpdateItemStatus, order }) {
  const status = orderStatus[order.order_status] || orderStatus.pending
  const finishedItems = order.items?.filter((item) => item.item_status === 'selesai').length || 0
  const totalItems = order.items?.length || 0

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-bold text-slate-950">Order #{order.id}</h3>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Utensils className="h-4 w-4" />
              Meja {order.table?.table_number || '-'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTime(order.created_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4" />
              {order.user?.name || 'Customer QR'}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-white px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase text-slate-400">Progress</p>
          <p className="mt-1 text-xl font-bold text-slate-950">
            {finishedItems}/{totalItems}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
            <ReceiptText className="h-3.5 w-3.5" />
            item selesai
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {(order.items || []).map((item) => (
          <KdsItemRow
            isBusy={busyItemId === item.id}
            item={item}
            key={item.id}
            onUpdateStatus={onUpdateItemStatus}
          />
        ))}
      </div>
    </article>
  )
}
