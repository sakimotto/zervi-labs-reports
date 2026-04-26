import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

export function SupplierStatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    Active: 'bg-success-soft text-success border-success/30',
    'On Hold': 'bg-warning-soft text-warning border-warning/30',
    Inactive: 'bg-muted text-muted-foreground border-border',
    Blacklisted: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  const cls = map[status ?? ''] ?? map.Inactive;
  return (
    <Badge variant="outline" className={cn('font-medium border', cls)}>
      <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status ?? '—'}
    </Badge>
  );
}

export function ApprovalBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    Approved: 'bg-success-soft text-success border-success/30',
    Pending: 'bg-warning-soft text-warning border-warning/30',
    Rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  const cls = map[status ?? ''] ?? map.Pending;
  return (
    <Badge variant="outline" className={cn('font-medium border text-[10px]', cls)}>
      {status ?? '—'}
    </Badge>
  );
}

export function StarRating({ value, max = 5 }: { value?: number | null; max?: number }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="inline-flex items-center gap-0.5" title={`${value} / ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i < value ? 'fill-warning text-warning' : 'text-muted-foreground/30')}
        />
      ))}
    </div>
  );
}
