import type { Judgment } from '@/types/lms';
import { cn } from '@/lib/utils';

interface JudgmentDotProps {
  judgment: Judgment;
  showLabel?: boolean;
}

export function JudgmentDot({ judgment, showLabel = true }: JudgmentDotProps) {
  const dotColor: Record<Judgment, string> = {
    OK: 'bg-success',
    NG: 'bg-destructive',
    Pending: 'bg-muted-foreground/40',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-2 h-2 rounded-full', dotColor[judgment])} />
      {showLabel && (
        <span className={cn(
          'text-xs font-medium',
          judgment === 'OK' && 'text-success',
          judgment === 'NG' && 'text-destructive',
          judgment === 'Pending' && 'text-muted-foreground',
        )}>
          {judgment}
        </span>
      )}
    </div>
  );
}
