import { Badge } from '@/components/ui/badge';

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground border-border',
  'In Review': 'bg-warning-soft text-warning border-warning/30',
  Approved: 'bg-success-soft text-success border-success/30',
  Active: 'bg-success-soft text-success border-success/30',
  Superseded: 'bg-muted text-muted-foreground border-border',
  Archived: 'bg-muted text-muted-foreground border-border line-through',
};

export function ProgramStatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground';
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {status}
    </Badge>
  );
}

export function ProgramVersionBadge({ version }: { version: number }) {
  return (
    <Badge variant="outline" className="text-[10px] font-mono bg-info-soft text-info border-info/30">
      v{version}
    </Badge>
  );
}

export function ProgramLockBadge({ locked }: { locked: boolean }) {
  if (!locked) return null;
  return (
    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-warning-soft text-warning border-warning/30">
      🔒 Locked
    </Badge>
  );
}
