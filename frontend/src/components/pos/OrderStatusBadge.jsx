import { Badge } from '../common/Badge'

const statusTone = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  cancelled: 'danger',
}

export function OrderStatusBadge({ status = 'pending' }) {
  return <Badge tone={statusTone[status] || 'default'}>{status}</Badge>
}
