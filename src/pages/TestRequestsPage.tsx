import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Search, CalendarClock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { RequestStatusBadge, PriorityBadge } from '@/components/customers/TestRequestBadges';
import {
  useAllTestRequests,
  REQUEST_STATUSES,
  REQUEST_PRIORITIES,
} from '@/hooks/useTestRequests';

type Row = {
  id: string;
  request_number: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  requested_date: string | null;
  po_number: string | null;
  customer_id: string;
  customers?: { name: string | null; customer_code: string | null } | null;
};

export default function TestRequestsPage() {
  const { data = [], isLoading } = useAllTestRequests();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const rows = data as unknown as Row[];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (priority !== 'all' && r.priority !== priority) return false;
      if (overdueOnly) {
        const isOverdue =
          r.due_date &&
          new Date(r.due_date) < now &&
          !['Reported', 'Cancelled', 'Completed'].includes(r.status);
        if (!isOverdue) return false;
      }
      if (!q) return true;
      return (
        r.request_number?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.po_number?.toLowerCase().includes(q) ||
        r.customers?.name?.toLowerCase().includes(q) ||
        r.customers?.customer_code?.toLowerCase().includes(q)
      );
    });
  }, [rows, search, status, priority, overdueOnly]);

  const summary = useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => !['Reported', 'Cancelled'].includes(r.status)).length;
    const overdue = rows.filter(
      (r) =>
        r.due_date &&
        new Date(r.due_date) < new Date() &&
        !['Reported', 'Cancelled', 'Completed'].includes(r.status),
    ).length;
    const reported = rows.filter((r) => r.status === 'Reported').length;
    return { total, open, overdue, reported };
  }, [rows]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Test Requests"
        description="All customer test requests (CTR) across the lab."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total" value={summary.total} />
        <Kpi label="Open" value={summary.open} tone="info" />
        <Kpi
          label="Overdue"
          value={summary.overdue}
          tone={summary.overdue > 0 ? 'destructive' : 'muted'}
          onClick={() => setOverdueOnly((v) => !v)}
          active={overdueOnly}
        />
        <Kpi label="Reported" value={summary.reported} tone="success" />
      </div>

      <Card className="p-3 shadow-card flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search request #, customer, PO, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {REQUEST_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant={overdueOnly ? 'default' : 'outline'}
          onClick={() => setOverdueOnly((v) => !v)}
        >
          Overdue only
        </Button>
        {(search || status !== 'all' || priority !== 'all' || overdueOnly) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStatus('all');
              setPriority('all');
              setOverdueOnly(false);
            }}
          >
            Clear
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </div>
      </Card>

      {isLoading ? (
        <Skeleton className="h-60 w-full" />
      ) : filtered.length === 0 ? (
        <Card className="shadow-card overflow-hidden">
          <EmptyState
            icon={ClipboardList}
            title="No test requests match"
            description="Try clearing filters or create a new request from a customer page."
          />
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b border-border">
                <Th>Request #</Th>
                <Th>Customer</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th>Requested</Th>
                <Th>Due</Th>
                <Th>PO</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const overdue =
                  r.due_date &&
                  new Date(r.due_date) < new Date() &&
                  !['Reported', 'Cancelled', 'Completed'].includes(r.status);
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border/60 last:border-b-0 hover:bg-primary-soft/40 ${i % 2 === 1 ? 'bg-card-muted' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs">{r.request_number}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/customers/${r.customer_id}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {r.customers?.name ?? '—'}
                        {r.customers?.customer_code && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({r.customers.customer_code})
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 max-w-[28ch] truncate" title={r.description ?? ''}>
                      {r.description ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5"><RequestStatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5"><PriorityBadge priority={r.priority} /></td>
                    <td className="px-4 py-2.5 text-xs">
                      {r.requested_date ? new Date(r.requested_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {r.due_date ? (
                        <span className={overdue ? 'text-destructive font-semibold inline-flex items-center gap-1' : 'inline-flex items-center gap-1'}>
                          <CalendarClock className="h-3 w-3" />
                          {new Date(r.due_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.po_number ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Button asChild size="sm" variant="ghost" title="Open customer">
                        <Link to={`/customers/${r.customer_id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  );
}

function Kpi({
  label,
  value,
  tone = 'muted',
  onClick,
  active,
}: {
  label: string;
  value: number;
  tone?: 'muted' | 'info' | 'success' | 'destructive';
  onClick?: () => void;
  active?: boolean;
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'destructive'
        ? 'text-destructive'
        : tone === 'info'
          ? 'text-info'
          : 'text-foreground';
  return (
    <Card
      onClick={onClick}
      className={`p-3 shadow-card ${onClick ? 'cursor-pointer transition-colors hover:bg-primary-soft/40' : ''} ${active ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${toneClass}`}>{value}</div>
    </Card>
  );
}
