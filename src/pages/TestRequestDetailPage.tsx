import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, Building2, Truck, PackageCheck, ShieldCheck,
  AlertTriangle, FlaskConical, Calendar, FileText, FlaskRound, Boxes,
  Plus, X, ExternalLink, Microscope, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { RequestStatusBadge, PriorityBadge } from '@/components/customers/TestRequestBadges';
import { CreateSamplesFromRequestDialog } from '@/components/customers/CreateSamplesFromRequestDialog';
import {
  useTestRequest,
  useUpdateTestRequest,
  useRequestSamples,
  useRequestMethods,
  useAddRequestMethods,
  useRemoveRequestMethod,
  useRequestMaterials,
  useAddRequestMaterials,
  useRemoveRequestMaterial,
  REQUEST_STATUSES,
  REQUEST_PRIORITIES,
  REQUEST_TYPES,
  type RequestType,
} from '@/hooks/useTestRequests';
import { useTestItems } from '@/hooks/useTestData';
import { useMaterials } from '@/hooks/useMaterials';
import { JudgmentDot } from '@/components/lms/JudgmentDot';

const ORIGIN_META: Record<RequestType, { label: string; icon: typeof Building2; tone: string }> = {
  customer: { label: 'Customer', icon: Building2, tone: 'text-primary' },
  supplier: { label: 'Supplier', icon: Truck, tone: 'text-info' },
  incoming_goods: { label: 'Incoming Goods', icon: PackageCheck, tone: 'text-warning' },
  internal_qa: { label: 'Internal QA', icon: ShieldCheck, tone: 'text-success' },
  production_issue: { label: 'Production Issue', icon: AlertTriangle, tone: 'text-destructive' },
  rd_trial: { label: 'R&D Trial', icon: FlaskConical, tone: 'text-accent-foreground' },
};

export default function TestRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useTestRequest(id ?? null);
  const update = useUpdateTestRequest();
  const [createSamplesOpen, setCreateSamplesOpen] = useState(false);
  const [addMethodsOpen, setAddMethodsOpen] = useState(false);
  const [addMaterialsOpen, setAddMaterialsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!request) {
    return (
      <Card className="shadow-card">
        <EmptyState icon={ClipboardList} title="Request not found" description="It may have been deleted." />
        <div className="p-3 border-t border-border">
          <Button asChild variant="ghost" size="sm">
            <Link to="/test-requests"><ArrowLeft className="h-4 w-4 mr-1" /> Back to all requests</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const r = request as any;
  const origin = ORIGIN_META[(r.request_type ?? 'customer') as RequestType] ?? ORIGIN_META.customer;
  const OriginIcon = origin.icon;
  const overdue =
    r.due_date && new Date(r.due_date) < new Date() &&
    !['Reported', 'Cancelled', 'Completed'].includes(r.status);

  const originHref =
    r.request_type === 'customer' && r.customer_id ? `/customers/${r.customer_id}` :
    r.request_type === 'supplier' && r.supplier_id ? `/suppliers/${r.supplier_id}` :
    null;

  const originName =
    r.customers?.name ?? r.suppliers?.name ?? r.internal_department ?? '—';

  const handleStatusChange = async (status: string) => {
    try {
      await update.mutateAsync({ id: r.id, status });
      toast.success(`Status set to ${status}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update status');
    }
  };
  const handlePriorityChange = async (priority: string) => {
    try {
      await update.mutateAsync({ id: r.id, priority });
      toast.success(`Priority set to ${priority}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update priority');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/test-requests" className="hover:text-foreground">Test Requests</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-mono text-foreground">{r.request_number}</span>
      </div>

      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span className="font-mono">{r.request_number}</span>
            <RequestStatusBadge status={r.status} />
            <PriorityBadge priority={r.priority} />
          </span>
        }
        description={r.description ?? 'No description'}
        actions={
          <Button size="sm" variant="outline" onClick={() => navigate('/test-requests')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        }
      />

      {/* Origin / metadata strip */}
      <Card className="p-4 shadow-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetaCell
            icon={<OriginIcon className={`h-4 w-4 ${origin.tone}`} />}
            label={origin.label}
            value={
              originHref ? (
                <Link to={originHref} className="text-primary hover:underline inline-flex items-center gap-1">
                  {originName} <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <span className="font-medium">{originName}</span>
              )
            }
          />
          <MetaCell
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            label="Requested"
            value={r.requested_date ? new Date(r.requested_date).toLocaleDateString() : '—'}
          />
          <MetaCell
            icon={<Calendar className={`h-4 w-4 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`} />}
            label="Due"
            value={
              r.due_date ? (
                <span className={overdue ? 'text-destructive font-semibold' : ''}>
                  {new Date(r.due_date).toLocaleDateString()}
                </span>
              ) : '—'
            }
          />
          <MetaCell
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            label="PO"
            value={r.po_number ?? '—'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Status</div>
            <Select value={r.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUEST_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Priority</div>
            <Select value={r.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUEST_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Test Program</div>
            {r.test_programs ? (
              <Link
                to={`/test-programs`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <FlaskRound className="h-3 w-3" /> {r.test_programs.name}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">— No program</span>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="samples">Samples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <OverviewTab request={r} />
        </TabsContent>

        <TabsContent value="methods" className="space-y-3">
          <MethodsTab requestId={r.id} onAdd={() => setAddMethodsOpen(true)} />
        </TabsContent>

        <TabsContent value="materials" className="space-y-3">
          <MaterialsTab requestId={r.id} onAdd={() => setAddMaterialsOpen(true)} />
        </TabsContent>

        <TabsContent value="samples" className="space-y-3">
          <SamplesTab requestId={r.id} onCreate={() => setCreateSamplesOpen(true)} />
        </TabsContent>
      </Tabs>

      <CreateSamplesFromRequestDialog
        open={createSamplesOpen}
        onOpenChange={setCreateSamplesOpen}
        request={r}
      />
      <AddMethodsDialog
        open={addMethodsOpen}
        onOpenChange={setAddMethodsOpen}
        requestId={r.id}
      />
      <AddMaterialsDialog
        open={addMaterialsOpen}
        onOpenChange={setAddMaterialsOpen}
        requestId={r.id}
      />
    </div>
  );
}

function MetaCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {icon} {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function OverviewTab({ request }: { request: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card className="p-4 shadow-card">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Description
        </h3>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {request.description ?? <span className="text-muted-foreground">No description</span>}
        </p>
      </Card>
      <Card className="p-4 shadow-card">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Scope notes
        </h3>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {request.scope ?? <span className="text-muted-foreground">No scope notes</span>}
        </p>
      </Card>
      <Card className="p-4 shadow-card">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Materials description
        </h3>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {request.materials_description ?? (
            <span className="text-muted-foreground">No materials description</span>
          )}
        </p>
      </Card>
      <Card className="p-4 shadow-card">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Contact
        </h3>
        <dl className="text-sm space-y-1">
          <div className="flex justify-between"><dt className="text-muted-foreground">Contact</dt><dd>{request.contact_person ?? '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Quote</dt><dd>{request.quoted_price ? `${request.currency ?? ''} ${request.quoted_price}` : '—'}</dd></div>
        </dl>
      </Card>
    </div>
  );
}

/* ---------------- Methods tab ---------------- */
function MethodsTab({ requestId, onAdd }: { requestId: string; onAdd: () => void }) {
  const { data = [], isLoading } = useRequestMethods(requestId);
  const remove = useRemoveRequestMethod();

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card className="shadow-card overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Microscope className="h-4 w-4 text-primary" /> Test methods ({data.length})
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add methods
        </Button>
      </div>
      {data.length === 0 ? (
        <EmptyState
          icon={Microscope}
          title="No methods linked"
          description="Add specific test methods, or rely on the linked test program."
        />
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left px-4 py-2">Method</th><th className="text-left px-4 py-2">Category</th><th className="text-left px-4 py-2">Direction</th><th className="text-left px-4 py-2">Notes</th><th /></tr>
          </thead>
          <tbody>
            {(data as any[]).map((m) => (
              <tr key={m.id} className="border-t border-border/60">
                <td className="px-4 py-2 font-medium">
                  <Link to={`/test-methods`} className="text-primary hover:underline">
                    {m.test_items?.name ?? `#${m.test_item_id}`}
                  </Link>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{m.test_items?.category ?? '—'}</td>
                <td className="px-4 py-2 text-xs">{m.direction ?? '—'}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{m.notes ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <Button
                    size="sm" variant="ghost"
                    onClick={async () => {
                      await remove.mutateAsync({ id: m.id, requestId });
                      toast.success('Removed');
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ---------------- Materials tab ---------------- */
function MaterialsTab({ requestId, onAdd }: { requestId: string; onAdd: () => void }) {
  const { data = [], isLoading } = useRequestMaterials(requestId);
  const remove = useRemoveRequestMaterial();

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card className="shadow-card overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Boxes className="h-4 w-4 text-primary" /> Materials ({data.length})
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add materials
        </Button>
      </div>
      {data.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No materials linked"
          description="Link cataloged materials so tests inherit the right specs."
        />
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left px-4 py-2">Material</th><th className="text-left px-4 py-2">Code</th><th className="text-left px-4 py-2">Type</th><th className="text-left px-4 py-2">Qty</th><th /></tr>
          </thead>
          <tbody>
            {(data as any[]).map((m) => (
              <tr key={m.id} className="border-t border-border/60">
                <td className="px-4 py-2 font-medium">
                  <Link to={`/materials/${m.material_id}`} className="text-primary hover:underline">
                    {m.materials?.name ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{m.materials?.material_code ?? '—'}</td>
                <td className="px-4 py-2 text-xs">{m.materials?.material_type ?? '—'}</td>
                <td className="px-4 py-2 text-xs">{m.quantity ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <Button
                    size="sm" variant="ghost"
                    onClick={async () => {
                      await remove.mutateAsync({ id: m.id, requestId });
                      toast.success('Removed');
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ---------------- Samples tab ---------------- */
function SamplesTab({ requestId, onCreate }: { requestId: string; onCreate: () => void }) {
  const { data = [], isLoading } = useRequestSamples(requestId);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <Card className="shadow-card overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <div className="text-sm font-semibold">Samples ({data.length})</div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Create samples
        </Button>
      </div>
      {data.length === 0 ? (
        <EmptyState icon={FlaskRound} title="No samples yet" description="Create samples to start testing." />
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left px-4 py-2">Sample ID</th><th className="text-left px-4 py-2">Product</th><th className="text-left px-4 py-2">Status</th><th className="text-left px-4 py-2">Judgment</th><th className="text-left px-4 py-2">Received</th></tr>
          </thead>
          <tbody>
            {(data as any[]).map((s) => (
              <tr key={s.id} className="border-t border-border/60 hover:bg-primary-soft/40">
                <td className="px-4 py-2 font-mono text-xs">
                  <Link to={`/tests/${s.id}`} className="text-primary hover:underline">{s.sample_id}</Link>
                </td>
                <td className="px-4 py-2">{s.product_name}</td>
                <td className="px-4 py-2 text-xs">{s.status}</td>
                <td className="px-4 py-2"><JudgmentDot judgment={s.overall_judgment} /></td>
                <td className="px-4 py-2 text-xs">
                  {s.received_date ? new Date(s.received_date).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ---------------- Add Methods Dialog ---------------- */
function AddMethodsDialog({ open, onOpenChange, requestId }: { open: boolean; onOpenChange: (v: boolean) => void; requestId: string }) {
  const { data: items = [] } = useTestItems();
  const { data: existing = [] } = useRequestMethods(requestId);
  const add = useAddRequestMethods();
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const existingIds = new Set((existing as any[]).map((e) => e.test_item_id));
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items as any[])
      .filter((i) => !existingIds.has(i.id))
      .filter((i) => !q || i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q))
      .slice(0, 200);
  }, [items, existingIds, search]);

  const toggle = (id: number) => {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
  };

  const submit = async () => {
    if (picked.size === 0) { onOpenChange(false); return; }
    try {
      await add.mutateAsync({ requestId, testItemIds: Array.from(picked) });
      toast.success(`Added ${picked.size} method(s)`);
      setPicked(new Set()); setSearch('');
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message ?? 'Failed'); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Add test methods</DialogTitle>
          <DialogDescription>Pick one or more methods. Already-added methods are hidden.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search methods…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-[50vh] overflow-y-auto border border-border rounded">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No methods to add.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer" onClick={() => toggle(i.id)}>
                  <Checkbox checked={picked.has(i.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-[11px] text-muted-foreground">{i.category} {i.unit && `· ${i.unit}`}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={picked.size === 0 || add.isPending}>
            Add {picked.size > 0 ? `(${picked.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Add Materials Dialog ---------------- */
function AddMaterialsDialog({ open, onOpenChange, requestId }: { open: boolean; onOpenChange: (v: boolean) => void; requestId: string }) {
  const { data: materials = [] } = useMaterials();
  const { data: existing = [] } = useRequestMaterials(requestId);
  const add = useAddRequestMaterials();
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const existingIds = new Set((existing as any[]).map((e) => e.material_id));
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (materials as any[])
      .filter((m) => !existingIds.has(m.id))
      .filter((m) => !q || m.name?.toLowerCase().includes(q) || m.material_code?.toLowerCase().includes(q))
      .slice(0, 200);
  }, [materials, existingIds, search]);

  const toggle = (id: string) => {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
  };

  const submit = async () => {
    if (picked.size === 0) { onOpenChange(false); return; }
    try {
      await add.mutateAsync({ requestId, materialIds: Array.from(picked) });
      toast.success(`Added ${picked.size} material(s)`);
      setPicked(new Set()); setSearch('');
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message ?? 'Failed'); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Add materials</DialogTitle>
          <DialogDescription>Link cataloged materials to this request.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search materials…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-[50vh] overflow-y-auto border border-border rounded">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No materials to add.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer" onClick={() => toggle(m.id)}>
                  <Checkbox checked={picked.has(m.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{m.material_code ?? '—'} · {m.material_type ?? '—'}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={picked.size === 0 || add.isPending}>
            Add {picked.size > 0 ? `(${picked.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
