import { Badge } from '@/components/ui/Badge';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils';
import { TicketStatus, Priority } from '@/types';

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge className={STATUS_COLORS[status]}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={PRIORITY_COLORS[priority]}>{priority.toUpperCase()}</Badge>;
}
