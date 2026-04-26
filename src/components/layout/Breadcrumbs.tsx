import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment, useMemo } from 'react';
import { cn } from '@/lib/utils';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  tests: 'Tests',
  'test-programs': 'Test Programs',
  'test-methods': 'Test Methods',
  sops: 'SOPs',
  equipment: 'Equipment',
  materials: 'Materials',
  standards: 'Standards',
  suppliers: 'Suppliers',
  customers: 'Customers',
};

function labelFor(segment: string) {
  if (ROUTE_LABELS[segment]) return ROUTE_LABELS[segment];
  // UUID / numeric id fallback — show truncated id
  if (segment.length > 12) return segment.slice(0, 8) + '…';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const crumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, i) => ({
      label: labelFor(part),
      href: '/' + parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1,
    }));
  }, [pathname]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-xs text-muted-foreground min-w-0', className)}
    >
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors shrink-0"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c, i) => (
        <Fragment key={c.href}>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
          {c.isLast ? (
            <span className="truncate text-foreground font-medium">{c.label}</span>
          ) : (
            <Link to={c.href} className="truncate hover:text-foreground transition-colors">
              {c.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
