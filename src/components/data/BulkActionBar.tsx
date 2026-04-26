import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Floating action bar that appears when rows are selected.
 * Slides up from the bottom of the viewport with primary surface.
 */
export function BulkActionBar({ count, onClear, children, className }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-2 px-3 py-2',
        'rounded-xl border border-border bg-card shadow-popover',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        className,
      )}
      role="region"
      aria-label="Bulk actions"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        className="h-8 w-8 shrink-0"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="text-xs font-semibold text-foreground px-2 border-r border-border">
        {count} selected
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}
