import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, LucideIcon } from 'lucide-react';

/* ────────────────────────────────────────────────────────────
 * FormSection — a titled card for grouping related fields.
 * Used inside dialogs, wizards, and full-page forms.
 * ──────────────────────────────────────────────────────────── */
interface FormSectionProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Right-aligned slot for actions (e.g. add button, optional toggle) */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bare?: boolean; // render without card chrome (for compact dialogs)
}

export function FormSection({
  title,
  description,
  icon: Icon,
  aside,
  children,
  className,
  bare = false,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        !bare && 'rounded-lg border border-border bg-card shadow-xs overflow-hidden',
        className,
      )}
    >
      <header
        className={cn(
          'flex items-start justify-between gap-3',
          bare ? 'mb-3' : 'border-b border-border bg-muted/40 px-4 py-3',
        )}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {Icon && (
              <span className="h-7 w-7 rounded-md bg-primary-soft text-primary inline-flex items-center justify-center">
                <Icon className="h-3.5 w-3.5" />
              </span>
            )}
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 ml-9 first:ml-0">
              {description}
            </p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </header>
      <div className={cn(!bare && 'p-4')}>{children}</div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
 * FormGrid — responsive 12-col grid for form fields.
 * ──────────────────────────────────────────────────────────── */
export function FormGrid({
  children,
  className,
  cols = 2,
}: {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}) {
  const colsClass =
    cols === 1
      ? 'grid-cols-1'
      : cols === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : cols === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  return <div className={cn('grid gap-x-4 gap-y-3', colsClass, className)}>{children}</div>;
}

/* ────────────────────────────────────────────────────────────
 * FormField — label + control + error/hint shell.
 * Pass any input control as `children`.
 * ──────────────────────────────────────────────────────────── */
interface FormFieldProps {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  /** Span across grid cells */
  span?: 1 | 2 | 3 | 4 | 'full';
}

export function FormField({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
  className,
  span,
}: FormFieldProps) {
  const spanClass =
    span === 'full'
      ? 'sm:col-span-full'
      : span === 2
        ? 'sm:col-span-2'
        : span === 3
          ? 'sm:col-span-3'
          : span === 4
            ? 'sm:col-span-4'
            : '';
  return (
    <div className={cn('space-y-1.5 min-w-0', spanClass, className)}>
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1"
      >
        {label}
        {required && <span className="text-destructive normal-case tracking-normal">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[11px] text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Themed Input + Textarea wrappers that show error border.
 * ──────────────────────────────────────────────────────────── */
type InputExtra = { error?: boolean };

export const FormInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & InputExtra
>(({ className, error, ...props }, ref) => (
  <Input
    ref={ref}
    aria-invalid={error || undefined}
    className={cn(
      'h-9',
      error && 'border-destructive focus-visible:ring-destructive/30',
      className,
    )}
    {...props}
  />
));
FormInput.displayName = 'FormInput';

export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & InputExtra
>(({ className, error, ...props }, ref) => (
  <Textarea
    ref={ref}
    aria-invalid={error || undefined}
    className={cn(
      error && 'border-destructive focus-visible:ring-destructive/30',
      className,
    )}
    {...props}
  />
));
FormTextarea.displayName = 'FormTextarea';

/* ────────────────────────────────────────────────────────────
 * StickyFormFooter — pinned action bar for dialogs / wizards.
 * Use with negative margins to align with dialog/page edges.
 * ──────────────────────────────────────────────────────────── */
export function StickyFormFooter({
  children,
  className,
  align = 'between',
}: {
  children: ReactNode;
  className?: string;
  align?: 'between' | 'end';
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 -mx-6 -mb-6 mt-4 px-6 py-3',
        'border-t border-border bg-card/95 backdrop-blur-md',
        'flex items-center gap-2',
        align === 'between' ? 'justify-between' : 'justify-end',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Wizard step indicator
 * ──────────────────────────────────────────────────────────── */
export function StepIndicator({
  steps,
  current,
  onJump,
}: {
  steps: { label: string; description?: string }[];
  current: number;
  onJump?: (index: number) => void;
}) {
  return (
    <ol className="flex items-stretch gap-0 w-full">
      {steps.map((step, i) => {
        const status: 'done' | 'active' | 'pending' =
          i < current ? 'done' : i === current ? 'active' : 'pending';
        const clickable = !!onJump && i <= current;
        return (
          <li key={i} className="flex-1 min-w-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump!(i)}
              className={cn(
                'w-full text-left flex items-center gap-3 px-3 py-2.5 border-b-2 transition-colors',
                status === 'active' && 'border-primary',
                status === 'done' && 'border-primary/40',
                status === 'pending' && 'border-border',
                clickable && 'hover:bg-muted/40 cursor-pointer',
                !clickable && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'h-7 w-7 shrink-0 rounded-full inline-flex items-center justify-center text-xs font-semibold border',
                  status === 'active' &&
                    'bg-primary text-primary-foreground border-primary shadow-card',
                  status === 'done' && 'bg-primary-soft text-primary border-primary/30',
                  status === 'pending' && 'bg-muted text-muted-foreground border-border',
                )}
              >
                {status === 'done' ? '✓' : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-xs font-semibold leading-tight',
                    status === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {step.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
