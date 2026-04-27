import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileBadge,
  Plus,
  Pencil,
  Trash2,
  Download,
  Mail,
  ExternalLink,
  Search,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  useCustomerReports,
  useDeleteReport,
  useUpdateReport,
  type DbTestReport,
} from '@/hooks/useTestReports';
import { useCustomerTestRequests } from '@/hooks/useTestRequests';
import { TestReportFormDialog } from './TestReportFormDialog';
import { ReportStatusBadge } from './TestRequestBadges';
import { AskAIButton, getReportAIActions } from '@/components/copilot/AskAIButton';

interface Props {
  customerId: string;
  customerEmail?: string | null;
  customerName?: string;
}

export function CustomerReportsTab({ customerId, customerEmail, customerName }: Props) {
  const { data: reports = [], isLoading } = useCustomerReports(customerId);
  const { data: requests = [] } = useCustomerTestRequests(customerId);
  const del = useDeleteReport();
  const update = useUpdateReport();

  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<DbTestReport | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r: any) =>
        r.report_number.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.recipient_email?.toLowerCase().includes(q),
    );
  }, [reports, search]);

  const summary = useMemo(() => {
    const total = reports.length;
    const draft = reports.filter((r: any) => r.status === 'Draft').length;
    const issued = reports.filter((r: any) => ['Issued', 'Sent'].includes(r.status)).length;
    const acked = reports.filter((r: any) => r.status === 'Acknowledged').length;
    return { total, draft, issued, acked };
  }, [reports]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allChecked = filtered.length > 0 && filtered.every((r: any) => selected.has(r.id));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((r: any) => r.id)));
  };

  const exportCsv = () => {
    const rows = reports.filter((r: any) => selected.has(r.id));
    if (rows.length === 0) return toast.error('Select at least one report');
    const headers = [
      'Report #', 'Title', 'Status', 'Issued date', 'Issued by',
      'Recipient', 'Judgment', 'Document URL', 'Linked request', 'Sample',
    ];
    const csv = [
      headers.join(','),
      ...rows.map((r: any) =>
        [
          r.report_number,
          r.title,
          r.status,
          r.issued_date ?? '',
          r.issued_by ?? '',
          r.recipient_email ?? '',
          r.overall_judgment ?? '',
          r.document_url ?? '',
          r.customer_test_requests?.request_number ?? '',
          r.samples?.sample_id ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customerName ?? 'customer'}-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} report${rows.length > 1 ? 's' : ''}`);
  };

  const emailSelected = () => {
    const rows = reports.filter((r: any) => selected.has(r.id));
    if (rows.length === 0) return toast.error('Select at least one report');
    const to = customerEmail ?? rows[0].recipient_email ?? '';
    if (!to) return toast.error('No recipient email on customer or reports');
    const subject = encodeURIComponent(
      rows.length === 1 ? `Test report ${rows[0].report_number}` : `${rows.length} test reports`,
    );
    const body = encodeURIComponent(
      rows
        .map(
          (r: any) =>
            `${r.report_number} — ${r.title}` +
            (r.document_url ? `\n${r.document_url}` : '') +
            (r.summary ? `\n${r.summary}` : ''),
        )
        .join('\n\n'),
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    // mark as Sent
    rows.forEach((r: any) => {
      if (r.status === 'Issued' || r.status === 'Draft') {
        update.mutate({ id: r.id, status: 'Sent', sent_at: new Date().toISOString() });
      }
    });
  };

  const markAcknowledged = (r: any) => {
    update.mutate(
      { id: r.id, status: 'Acknowledged', acknowledged_at: new Date().toISOString() },
      { onSuccess: () => toast.success('Marked as acknowledged') },
    );
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total" value={summary.total} />
        <KpiCard label="Draft" value={summary.draft} />
        <KpiCard label="Issued / Sent" value={summary.issued} tone="info" />
        <KpiCard label="Acknowledged" value={summary.acked} tone="success" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search report #, title, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {selected.size > 0 && (
          <>
            <span className="text-xs text-muted-foreground px-2">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={emailSelected}>
              <Mail className="h-3.5 w-3.5 mr-1" /> Email
            </Button>
          </>
        )}
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> New report
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-card overflow-hidden">
          <EmptyState
            icon={FileBadge}
            title="No reports yet"
            description="Issue a test report when results are completed for this customer. Track its status through Draft → Issued → Sent → Acknowledged."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setOpenForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> New report
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b border-border">
                <th className="px-3 py-2.5 w-8">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                </th>
                <Th>Report #</Th>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Judgment</Th>
                <Th>Issued</Th>
                <Th>Linked</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any, i: number) => (
                <tr
                  key={r.id}
                  className={`border-b border-border/60 last:border-b-0 hover:bg-primary-soft/40 ${i % 2 === 1 ? 'bg-card-muted' : ''}`}
                >
                  <td className="px-3 py-2.5">
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.report_number}</td>
                  <td className="px-4 py-2.5 max-w-[28ch] truncate" title={r.title}>{r.title}</td>
                  <td className="px-4 py-2.5"><ReportStatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 text-xs">
                    <JudgmentPill value={r.overall_judgment} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {r.issued_date ? new Date(r.issued_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {r.customer_test_requests?.request_number ? (
                      <Link
                        to={`/test-requests/${r.test_request_id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {r.customer_test_requests.request_number}
                      </Link>
                    ) : r.samples?.sample_id ? (
                      <Link
                        to={`/tests/${r.sample_id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {r.samples.sample_id}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <AskAIButton
                      iconOnly
                      title="Ask AI about this report"
                      context={{ type: 'test_report', id: r.id, label: r.report_number }}
                      actions={getReportAIActions(r.report_number)}
                    />
                    {r.document_url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={r.document_url} target="_blank" rel="noopener noreferrer" title="Open document">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {r.status === 'Sent' && (
                      <Button size="sm" variant="ghost" onClick={() => markAcknowledged(r)} title="Mark acknowledged">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      </Button>
                    )}
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
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <TestReportFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        customerId={customerId}
        defaultRecipient={customerEmail}
        report={editing}
        requests={requests.map((r) => ({ id: r.id, request_number: r.request_number }))}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await del.mutateAsync(deleteId);
                  toast.success('Report deleted');
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

function JudgmentPill({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const cls =
    value === 'OK'
      ? 'bg-success-soft text-success'
      : value === 'NG'
        ? 'bg-destructive/10 text-destructive'
        : value === 'Conditional'
          ? 'bg-warning-soft text-warning'
          : 'bg-muted text-muted-foreground';
  return <span className={`px-2 py-0.5 rounded font-semibold ${cls}`}>{value}</span>;
}
