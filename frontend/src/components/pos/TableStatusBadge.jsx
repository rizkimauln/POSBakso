import { Badge } from '../common/Badge'

const statusTone = {
  available: 'success',
  occupied: 'warning',
  reserved: 'info',
  inactive: 'default',
}

export function TableStatusBadge({ status = 'available' }) {
  return <Badge tone={statusTone[status] || 'default'}>{status}</Badge>
}
