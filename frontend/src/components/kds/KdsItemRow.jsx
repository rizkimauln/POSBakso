import { Check, Flame, RotateCcw } from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

const statusConfig = {
  pending: { label: 'Pending', tone: 'warning' },
  dimasak: { label: 'Dimasak', tone: 'info' },
  selesai: { label: 'Selesai', tone: 'success' },
}

export function KdsItemRow({ item, isBusy, onUpdateStatus }) {
  const config = statusConfig[item.item_status] || statusConfig.pending

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold text-slate-950">
              {item.quantity}x {item.menu?.name || `Menu #${item.menu_id}`}
            </p>
            <Badge tone={config.tone}>{config.label}</Badge>
          </div>
          {item.notes ? <p className="mt-2 text-sm font-medium text-red-700">{item.notes}</p> : null}
          <p className="mt-1 text-xs text-slate-500">{item.menu?.category?.name || '-'}</p>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button
            disabled={isBusy || item.item_status === 'pending'}
            onClick={() => onUpdateStatus(item, 'pending')}
            size="sm"
            variant="secondary"
          >
            <RotateCcw className="h-4 w-4" />
            Pending
          </Button>
          <Button
            disabled={isBusy || item.item_status === 'dimasak'}
            onClick={() => onUpdateStatus(item, 'dimasak')}
            size="sm"
            variant="secondary"
          >
            <Flame className="h-4 w-4" />
            Dimasak
          </Button>
          <Button
            disabled={isBusy || item.item_status === 'selesai'}
            onClick={() => onUpdateStatus(item, 'selesai')}
            size="sm"
          >
            <Check className="h-4 w-4" />
            Selesai
          </Button>
        </div>
      </div>
    </div>
  )
}
