import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
  ExternalLink,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/data/EmptyState';
import {
  useCustomerTestRequests,
  useDeleteTestRequest,
  type DbTestRequest,
} from '@/hooks/useTestRequests';
import { TestRequestFormDialog } from './TestRequestFormDialog';
import { RequestStatusBadge, PriorityBadge } from './TestRequestBadges';

interface Props {
  customerId: string;
  customerEmail?: string | null;
}

export function CustomerTestRequestsTab({ customerId }: Props) {
  const { data = [], isLoading } = useCustomerTestRequests(customerId);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<DbTestRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const del = useDeleteTestRequest();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        r.request_number.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.po_number?.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [data, search]);

  const summary = useMemo(() => {
    const total = data.length;
    const open = data.filter((r) => !['Reported', 'Cancelled'].includes(r.status)).length;
    const overdue = data.filter(
      (r) =>
        r.due_date &&
        new Date(r.due_date) < new Date() &&
        !['Reported', 'Cancelled', 'Completed'].includes(r.status),
    ).length;
    const reported = data.filter((r) => r.status === 'Reported').length;
    return { total, open, overdue, reported };
  }, [data]);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total" value={summary.total} />
        <KpiCard label="Open" value={summary.open} tone="info" />
        <KpiCard label="Overdue" value={summary.overdue} tone={summary.overdue > 0 ? 'destructive' : 'muted'} />
        <KpiCard label="Reported" value={summary.reported} tone="success" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search request #, PO, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> New request
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="shadow-card overflow-hidden">
          <EmptyState
            icon={ClipboardList}
            title="No test requests"
            description="When this customer asks the lab to test materials, log the request here so it can be tracked through quote → testing → reporting."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setOpenForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> New request
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b border-border">
                <Th>Request #</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th>Due</Th>
                <Th>PO</Th>
                <Th className="text-right">Actions</Th>
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
                    <td className="px-4 py-2.5 max-w-[28ch] truncate" title={r.description ?? ''}>
                      {r.description}
                    </td>
                    <td className="px-4 py-2.5"><RequestStatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5"><PriorityBadge priority={r.priority} /></td>
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
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(r);
                          setOpenForm(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <TestRequestFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        customerId={customerId}
        request={editing}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the request. Reports linked to it will lose the link but remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await del.mutateAsync(deleteId);
                  toast.success('Request deleted');
                } catch (e: any) {
                  toast.error(e.message ?? 'Failed to delete');
                }
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${className ?? ''}`}
    >
      {children}
    </th>
  );
}

function KpiCard({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: number;
  tone?: 'muted' | 'info' | 'success' | 'destructive';
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
    <Card className="p-3 shadow-card">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${toneClass}`}>{value}</div>
    </Card>
  );
}
