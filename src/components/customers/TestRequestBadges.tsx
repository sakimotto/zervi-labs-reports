import { cn } from '@/lib/utils';

const REQ_STATUS_STYLES: Record<string, string> = {
  Requested: 'bg-muted text-muted-foreground border-border',
  Quoted: 'bg-info-soft text-info border-info/30',
  Approved: 'bg-primary-soft text-primary border-primary/30',
  'In Progress': 'bg-warning-soft text-warning border-warning/30',
  Completed: 'bg-success-soft text-success border-success/30',
  Reported: 'bg-success-soft text-success border-success/30',
  Cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function RequestStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border',
        REQ_STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      {status}
    </span>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  Low: 'bg-muted text-muted-foreground',
  Normal: 'bg-info-soft text-info',
  High: 'bg-warning-soft text-warning',
  Urgent: 'bg-destructive/10 text-destructive',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
        PRIORITY_STYLES[priority] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {priority}
    </span>
  );
}

const REPORT_STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground border-border',
  Issued: 'bg-info-soft text-info border-info/30',
  Sent: 'bg-primary-soft text-primary border-primary/30',
  Acknowledged: 'bg-success-soft text-success border-success/30',
  Revoked: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function ReportStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border',
        REPORT_STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      {status}
    </span>
  );
}
