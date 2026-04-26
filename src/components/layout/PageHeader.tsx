import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * Standardized page header used across the app.
 * - Provides consistent vertical rhythm and type scale
 * - Slots for eyebrow (status/breadcrumb context), actions, and meta chips
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'border-b border-border/70 bg-card/60 backdrop-blur-sm',
        'px-6 py-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {meta && <div className="mt-3 flex items-center gap-2 flex-wrap">{meta}</div>}
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}

/**
 * Standard padded container for page bodies, matching PageHeader gutters.
 */
export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}
