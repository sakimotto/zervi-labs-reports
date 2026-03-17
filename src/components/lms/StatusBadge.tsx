import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'priority';
}

export function StatusBadge({ status, type = 'status' }: StatusBadgeProps) {
  const base = 'text-xs font-medium px-1.5 py-0.5 rounded-sm';
  
  if (type === 'priority') {
    const styles: Record<string, string> = {
      Normal: 'bg-muted text-muted-foreground',
      Urgent: 'bg-warning/10 text-warning',
      Critical: 'bg-destructive/10 text-destructive',
    };
    return <span className={cn(base, styles[status] || styles.Normal)}>{status}</span>;
  }

  const styles: Record<string, string> = {
    Pending: 'bg-muted text-muted-foreground',
    'In Progress': 'bg-primary/10 text-primary',
    Completed: 'bg-success/10 text-success',
    Approved: 'bg-success/10 text-success',
  };

  return <span className={cn(base, styles[status] || styles.Pending)}>{status}</span>;
}
