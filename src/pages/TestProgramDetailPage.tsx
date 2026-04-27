import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Send, Check, X, GitBranch, Copy, Share2, Printer, Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProgramStatusBadge, ProgramVersionBadge, ProgramLockBadge } from '@/components/test-programs/ProgramBadges';
import { useTestItems } from '@/hooks/useTestData';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useMaterials } from '@/hooks/useMaterials';
import {
  useTestProgramDetail, useProgramVersions, useProgramApprovals, useProgramAudit,
  useTransitionProgramStatus, useCreateNewVersion, useUpsertSupplierLink, useDeleteSupplierLink,
  useUpsertSkuPattern, useDeleteSkuPattern, useAddMaterialTypeTag, useDeleteMaterialTypeTag,
  useAddMaterialLink, useDeleteMaterialLink, useCloneProgram, useGenerateShareToken,
} from '@/hooks/useTestProgramLifecycle';
import { useUpdateTestProgram, useUpdateTestProgramItems } from '@/hooks/useTestPrograms';
import { supabase } from '@/integrations/supabase/client';

export default function TestProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: program, isLoading } = useTestProgramDetail(id ?? null);
  const transition = useTransitionProgramStatus();
  const newVersion = useCreateNewVersion();
  const cloneProgram = useCloneProgram();
  const generateShare = useGenerateShareToken();

  const [transitionDialog, setTransitionDialog] = useState<{ to: any; comments: string } | null>(null);
  const [cloneDialog, setCloneDialog] = useState<{ name: string } | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!program) return <div className="p-6 text-sm text-muted-foreground">Program not found.</div>;

  const isDraft = program.status === 'Draft';
  const isInReview = program.status === 'In Review';
  const isApproved = program.status === 'Approved' || program.status === 'Active';
  const isArchived = program.status === 'Archived' || program.status === 'Superseded';

  const handleTransition = async (to: any, comments?: string) => {
    try {
      await transition.mutateAsync({
        programId: program.id,
        toStatus: to,
        versionNumber: program.version_number,
        comments,
      });
      toast.success(`Status changed to ${to}`);
      setTransitionDialog(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleNewVersion = async () => {
    try {
      const v = await newVersion.mutateAsync({ programId: program.id });
      toast.success(`New version v${v} created (Draft)`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleClone = async () => {
    if (!cloneDialog?.name?.trim()) return;
    try {
      const np = await cloneProgram.mutateAsync({ programId: program.id, newName: cloneDialog.name });
      toast.success('Cloned');
      setCloneDialog(null);
      navigate(`/test-programs/${np.id}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleShare = async () => {
    try {
      const token = await generateShare.mutateAsync({ programId: program.id });
      const url = `${window.location.origin}/test-programs/${program.id}?share=${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-4">
        <Breadcrumbs items={[{ label: 'Test Programs', to: '/test-programs' }, { label: program.name }]} />
      </div>

      <PageHeader
        eyebrow={program.program_code || 'TEST PROGRAM'}
        title={
          <span className="flex items-center gap-2">
            {program.name}
            <ProgramStatusBadge status={program.status} />
            <ProgramVersionBadge version={program.version_number} />
            <ProgramLockBadge locked={program.is_locked} />
          </span>
        }
        description={program.description || program.purpose || undefined}
        actions={
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate('/test-programs')} className="gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            {isDraft && (
              <Button size="sm" variant="outline" onClick={() => setTransitionDialog({ to: 'In Review', comments: '' })} className="gap-1">
                <Send className="h-3.5 w-3.5" /> Submit for Review
              </Button>
            )}
            {isInReview && (
              <>
                <Button size="sm" onClick={() => setTransitionDialog({ to: 'Approved', comments: '' })} className="gap-1 bg-success text-success-foreground hover:bg-success/90">
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTransitionDialog({ to: 'Draft', comments: '' })} className="gap-1">
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </>
            )}
            {isApproved && !isArchived && (
              <>
                <Button size="sm" variant="outline" onClick={handleNewVersion} disabled={newVersion.isPending} className="gap-1">
                  <GitBranch className="h-3.5 w-3.5" /> New Version
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTransitionDialog({ to: 'Archived', comments: '' })} className="gap-1">
                  <Lock className="h-3.5 w-3.5" /> Archive
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setCloneDialog({ name: `${program.name} (copy)` })} className="gap-1">
              <Copy className="h-3.5 w-3.5" /> Clone
            </Button>
            <Button size="sm" variant="ghost" onClick={handleShare} className="gap-1">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.print()} className="gap-1">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        }
      />

      <div className="px-6 py-5">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="methods">Methods ({program.test_program_items?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="materials">Materials & SKUs</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers ({program.program_supplier_links?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab program={program} locked={program.is_locked} />
          </TabsContent>
          <TabsContent value="methods" className="mt-4">
            <MethodsTab program={program} locked={program.is_locked} />
          </TabsContent>
          <TabsContent value="materials" className="mt-4">
            <MaterialsTab program={program} locked={program.is_locked} />
          </TabsContent>
          <TabsContent value="suppliers" className="mt-4">
            <SuppliersTab program={program} locked={program.is_locked} />
          </TabsContent>
          <TabsContent value="approvals" className="mt-4">
            <ApprovalsTab programId={program.id} />
          </TabsContent>
          <TabsContent value="versions" className="mt-4">
            <VersionsTab programId={program.id} currentVersion={program.version_number} />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <AuditTab programId={program.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Transition dialog */}
      <Dialog open={!!transitionDialog} onOpenChange={(o) => !o && setTransitionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transition to "{transitionDialog?.to}"</DialogTitle>
            <DialogDescription>
              {transitionDialog?.to === 'Approved' && 'Approving will lock this version and create an immutable snapshot. Further edits will require creating a new version.'}
              {transitionDialog?.to === 'In Review' && 'Submitting will request approval from a lab manager.'}
              {transitionDialog?.to === 'Draft' && 'Sending back to Draft will allow further edits.'}
              {transitionDialog?.to === 'Archived' && 'Archiving will retire this program. It can no longer be used for new tests.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Comments (optional)"
            value={transitionDialog?.comments ?? ''}
            onChange={e => setTransitionDialog(t => t ? { ...t, comments: e.target.value } : null)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setTransitionDialog(null)}>Cancel</Button>
            <Button size="sm" onClick={() => handleTransition(transitionDialog!.to, transitionDialog!.comments)} disabled={transition.isPending}>
              {transition.isPending ? 'Working…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone dialog */}
      <Dialog open={!!cloneDialog} onOpenChange={(o) => !o && setCloneDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Program</DialogTitle>
            <DialogDescription>Creates a fresh Draft program (v1) with all the methods copied.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="New program name"
            value={cloneDialog?.name ?? ''}
            onChange={e => setCloneDialog(c => c ? { ...c, name: e.target.value } : null)}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setCloneDialog(null)}>Cancel</Button>
            <Button size="sm" onClick={handleClone} disabled={cloneProgram.isPending || !cloneDialog?.name?.trim()}>
              {cloneProgram.isPending ? 'Cloning…' : 'Clone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// OVERVIEW
// ============================================================
function OverviewTab({ program, locked }: { program: any; locked: boolean }) {
  const update = useUpdateTestProgram();
  const [form, setForm] = useState({
    name: program.name || '',
    description: program.description || '',
    material_type: program.material_type || '',
    report_title: program.report_title || '',
    report_header_notes: program.report_header_notes || '',
    report_footer_notes: program.report_footer_notes || '',
  });
  const [extra, setExtra] = useState({
    category: program.category || '',
    purpose: program.purpose || '',
    scope_notes: program.scope_notes || '',
    intended_use: program.intended_use || '',
  });

  const dirty = JSON.stringify(form) !== JSON.stringify({
    name: program.name || '', description: program.description || '', material_type: program.material_type || '',
    report_title: program.report_title || '', report_header_notes: program.report_header_notes || '', report_footer_notes: program.report_footer_notes || '',
  }) || JSON.stringify(extra) !== JSON.stringify({
    category: program.category || '', purpose: program.purpose || '', scope_notes: program.scope_notes || '', intended_use: program.intended_use || '',
  });

  const save = async () => {
    try {
      await update.mutateAsync({ id: program.id, updates: form });
      await supabase.from('test_programs').update({
        category: extra.category || null,
        purpose: extra.purpose || null,
        scope_notes: extra.scope_notes || null,
        intended_use: extra.intended_use || null,
      }).eq('id', program.id);
      toast.success('Saved');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card title="Identity">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} disabled={locked} />
            <Field label="Category" value={extra.category} onChange={v => setExtra(f => ({ ...f, category: v }))} disabled={locked} />
            <Field label="Material Type" value={form.material_type} onChange={v => setForm(f => ({ ...f, material_type: v }))} disabled={locked} />
            <Field label="Intended Use" value={extra.intended_use} onChange={v => setExtra(f => ({ ...f, intended_use: v }))} disabled={locked} />
          </div>
          <Area label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} disabled={locked} />
          <Area label="Purpose" value={extra.purpose} onChange={v => setExtra(f => ({ ...f, purpose: v }))} disabled={locked} />
          <Area label="Scope Notes" value={extra.scope_notes} onChange={v => setExtra(f => ({ ...f, scope_notes: v }))} disabled={locked} />
        </Card>

        <Card title="Report Layout">
          <Field label="Report Title" value={form.report_title} onChange={v => setForm(f => ({ ...f, report_title: v }))} disabled={locked} />
          <Area label="Header Notes" value={form.report_header_notes} onChange={v => setForm(f => ({ ...f, report_header_notes: v }))} disabled={locked} />
          <Area label="Footer Notes" value={form.report_footer_notes} onChange={v => setForm(f => ({ ...f, report_footer_notes: v }))} disabled={locked} />
        </Card>

        {dirty && !locked && (
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        )}
        {locked && (
          <div className="text-xs text-warning bg-warning-soft border border-warning/30 rounded px-3 py-2">
            🔒 This version is locked. Click <strong>New Version</strong> in the header to make changes.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card title="Lifecycle">
          <Row label="Status"><ProgramStatusBadge status={program.status} /></Row>
          <Row label="Version">v{program.version_number}</Row>
          <Row label="Locked">{program.is_locked ? 'Yes' : 'No'}</Row>
          <Row label="Submitted">{program.submitted_at ? new Date(program.submitted_at).toLocaleString() : '—'}</Row>
          <Row label="Approved">{program.approved_at ? new Date(program.approved_at).toLocaleString() : '—'}</Row>
          <Row label="Approver">{program.approver_name || '—'}</Row>
        </Card>

        <Card title="Linkage">
          <Row label="Materials">{program.material_test_programs?.length ?? 0}</Row>
          <Row label="Suppliers">{program.program_supplier_links?.length ?? 0}</Row>
          <Row label="SKU patterns">{program.program_sku_patterns?.length ?? 0}</Row>
          <Row label="Material-type tags">{program.program_material_type_tags?.length ?? 0}</Row>
          <Row label="Methods">{program.test_program_items?.length ?? 0}</Row>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// METHODS
// ============================================================
function MethodsTab({ program, locked }: { program: any; locked: boolean }) {
  const { data: allTestItems = [] } = useTestItems();
  const updateItems = useUpdateTestProgramItems();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(
    new Set((program.test_program_items || []).map((i: any) => i.test_item_id as number))
  );

  const grouped = new Map<string, any[]>();
  allTestItems.forEach(it => {
    const list = grouped.get(it.category) || [];
    list.push(it);
    grouped.set(it.category, list);
  });

  const save = async () => {
    try {
      await updateItems.mutateAsync({ programId: program.id, testItemIds: Array.from(selected) });
      toast.success('Methods updated');
      setEditing(false);
    } catch (err: any) { toast.error(err.message); }
  };

  if (!editing) {
    return (
      <Card
        title={`Test Methods (${program.test_program_items?.length ?? 0})`}
        action={!locked && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit Methods</Button>}
      >
        {(program.test_program_items || []).length === 0 ? (
          <div className="text-sm text-muted-foreground italic">No methods assigned yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {(program.test_program_items || []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{item.test_items?.name}</div>
                  <div className="text-xs text-muted-foreground">{item.test_items?.category} {item.test_items?.unit && `· ${item.test_items.unit}`}</div>
                </div>
                {item.test_items?.direction_required && <span className="text-[10px] font-semibold text-info bg-info-soft px-1.5 py-0.5 rounded">DIRECTIONAL</span>}
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card title={`Edit Methods (${selected.size} selected)`} action={
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={updateItems.isPending}>{updateItems.isPending ? 'Saving…' : 'Save'}</Button>
      </div>
    }>
      <div className="max-h-[60vh] overflow-y-auto space-y-3">
        {Array.from(grouped.entries()).map(([cat, items]) => (
          <div key={cat}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{cat}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {items.map(item => (
                <label key={item.id} className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded cursor-pointer transition-colors ${selected.has(item.id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => {
                    setSelected(prev => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                      return next;
                    });
                  }} />
                  <span className="font-medium">{item.name}</span>
                  {item.unit && <span className="text-muted-foreground text-xs">({item.unit})</span>}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// MATERIALS & SKU PATTERNS
// ============================================================
function MaterialsTab({ program, locked }: { program: any; locked: boolean }) {
  const { data: materials = [] } = useMaterials();
  const addMat = useAddMaterialLink();
  const delMat = useDeleteMaterialLink();
  const addTag = useAddMaterialTypeTag();
  const delTag = useDeleteMaterialTypeTag();
  const addSku = useUpsertSkuPattern();
  const delSku = useDeleteSkuPattern();

  const [matToAdd, setMatToAdd] = useState('');
  const [tagToAdd, setTagToAdd] = useState('');
  const [skuForm, setSkuForm] = useState({ pattern: '', matchType: 'glob' as const, priority: 100, description: '' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card title={`Linked Materials (${program.material_test_programs?.length ?? 0})`}>
        <div className="space-y-1.5 mb-3">
          {(program.material_test_programs || []).map((link: any) => (
            <div key={link.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-2 text-sm">
              <Link to={`/materials/${link.material_id}`} className="font-medium hover:text-primary">{link.materials?.name}</Link>
              {!locked && (
                <button onClick={async () => { await delMat.mutateAsync({ id: link.id, programId: program.id }); toast.success('Removed'); }} className="text-destructive hover:bg-destructive/10 rounded p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {(program.material_test_programs || []).length === 0 && <div className="text-xs text-muted-foreground italic">No materials linked.</div>}
        </div>
        {!locked && (
          <div className="flex gap-1.5">
            <Select value={matToAdd} onValueChange={setMatToAdd}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick a material…" /></SelectTrigger>
              <SelectContent>
                {materials.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={async () => {
              if (!matToAdd) return;
              try { await addMat.mutateAsync({ programId: program.id, materialId: matToAdd }); toast.success('Linked'); setMatToAdd(''); }
              catch (err: any) { toast.error(err.message); }
            }}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        )}
      </Card>

      <Card title={`Material-Type Tags (${program.program_material_type_tags?.length ?? 0})`}>
        <div className="space-y-1.5 mb-3">
          {(program.program_material_type_tags || []).map((tag: any) => (
            <div key={tag.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-2 text-sm">
              <span className="font-mono text-xs">{tag.material_type}</span>
              {!locked && (
                <button onClick={async () => { await delTag.mutateAsync({ id: tag.id, programId: program.id }); toast.success('Removed'); }} className="text-destructive hover:bg-destructive/10 rounded p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {(program.program_material_type_tags || []).length === 0 && <div className="text-xs text-muted-foreground italic">No type tags.</div>}
        </div>
        {!locked && (
          <div className="flex gap-1.5">
            <Input value={tagToAdd} onChange={e => setTagToAdd(e.target.value)} placeholder="e.g. Canvas" className="h-8 text-xs" />
            <Button size="sm" onClick={async () => {
              if (!tagToAdd.trim()) return;
              try { await addTag.mutateAsync({ programId: program.id, materialType: tagToAdd.trim() }); toast.success('Added'); setTagToAdd(''); }
              catch (err: any) { toast.error(err.message); }
            }}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        )}
      </Card>

      <Card title={`SKU Patterns (${program.program_sku_patterns?.length ?? 0})`}>
        <div className="space-y-1.5 mb-3">
          {(program.program_sku_patterns || []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-2 text-sm">
              <div>
                <div className="font-mono text-xs">{p.pattern}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{p.match_type} · priority {p.priority}</div>
              </div>
              {!locked && (
                <button onClick={async () => { await delSku.mutateAsync({ id: p.id, programId: program.id }); toast.success('Removed'); }} className="text-destructive hover:bg-destructive/10 rounded p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {(program.program_sku_patterns || []).length === 0 && <div className="text-xs text-muted-foreground italic">No SKU rules.</div>}
        </div>
        {!locked && (
          <div className="space-y-1.5">
            <Input value={skuForm.pattern} onChange={e => setSkuForm(f => ({ ...f, pattern: e.target.value }))} placeholder="e.g. CANV-* or PVC-650-*" className="h-8 text-xs font-mono" />
            <div className="flex gap-1.5">
              <Select value={skuForm.matchType} onValueChange={(v: any) => setSkuForm(f => ({ ...f, matchType: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact</SelectItem>
                  <SelectItem value="prefix">Prefix</SelectItem>
                  <SelectItem value="glob">Glob</SelectItem>
                  <SelectItem value="regex">Regex</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={async () => {
                if (!skuForm.pattern.trim()) return;
                try {
                  await addSku.mutateAsync({ programId: program.id, pattern: skuForm.pattern.trim(), matchType: skuForm.matchType, priority: skuForm.priority });
                  toast.success('Added'); setSkuForm({ pattern: '', matchType: 'glob', priority: 100, description: '' });
                } catch (err: any) { toast.error(err.message); }
              }}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// SUPPLIERS
// ============================================================
function SuppliersTab({ program, locked }: { program: any; locked: boolean }) {
  const { data: suppliers = [] } = useSuppliers();
  const addLink = useUpsertSupplierLink();
  const delLink = useDeleteSupplierLink();
  const [supId, setSupId] = useState('');

  return (
    <Card title={`Linked Suppliers (${program.program_supplier_links?.length ?? 0})`}>
      <div className="space-y-1.5 mb-3">
        {(program.program_supplier_links || []).map((link: any) => (
          <div key={link.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-2 text-sm">
            <div>
              <Link to={`/suppliers/${link.supplier_id}`} className="font-medium hover:text-primary">{link.suppliers?.name}</Link>
              <div className="text-xs text-muted-foreground">{link.suppliers?.supplier_type} · {link.suppliers?.status}</div>
            </div>
            {!locked && (
              <button onClick={async () => { await delLink.mutateAsync({ id: link.id, programId: program.id }); toast.success('Removed'); }} className="text-destructive hover:bg-destructive/10 rounded p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {(program.program_supplier_links || []).length === 0 && <div className="text-xs text-muted-foreground italic">No suppliers linked.</div>}
      </div>
      {!locked && (
        <div className="flex gap-1.5 max-w-md">
          <Select value={supId} onValueChange={setSupId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick a supplier…" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={async () => {
            if (!supId) return;
            try { await addLink.mutateAsync({ programId: program.id, supplierId: supId }); toast.success('Linked'); setSupId(''); }
            catch (err: any) { toast.error(err.message); }
          }}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
      )}
    </Card>
  );
}

// ============================================================
// APPROVALS
// ============================================================
function ApprovalsTab({ programId }: { programId: string }) {
  const { data: approvals = [], isLoading } = useProgramApprovals(programId);
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  return (
    <Card title={`Approval Trail (${approvals.length})`}>
      {approvals.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">No approval activity yet.</div>
      ) : (
        <div className="space-y-2">
          {approvals.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 bg-muted/40 rounded px-3 py-2 text-sm">
              <div className="flex-shrink-0 mt-0.5">
                {a.action === 'approved' ? <Check className="h-4 w-4 text-success" /> :
                 a.action === 'rejected' ? <X className="h-4 w-4 text-destructive" /> :
                 a.action === 'submitted' ? <Send className="h-4 w-4 text-info" /> :
                 <GitBranch className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase text-xs tracking-wider">{a.action}</span>
                  <ProgramVersionBadge version={a.version_number} />
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">by {a.actor_name || 'system'}</div>
                {a.comments && <div className="text-xs mt-1.5 italic">"{a.comments}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// VERSIONS
// ============================================================
function VersionsTab({ programId, currentVersion }: { programId: string; currentVersion: number }) {
  const { data: versions = [], isLoading } = useProgramVersions(programId);
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  return (
    <Card title={`Version History (${versions.length})`}>
      {versions.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">No versions snapshotted yet. Versions are created automatically on approval.</div>
      ) : (
        <div className="space-y-2">
          {versions.map((v: any) => (
            <div key={v.id} className="flex items-start gap-3 bg-muted/40 rounded px-3 py-2 text-sm">
              <ProgramVersionBadge version={v.version_number} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{v.snapshot?.name}</span>
                  {v.version_number === currentVersion && <span className="text-[10px] font-bold uppercase text-success bg-success-soft px-1.5 py-0.5 rounded">CURRENT</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(v.created_at).toLocaleString()}</span>
                </div>
                {v.change_notes && <div className="text-xs text-muted-foreground mt-0.5">{v.change_notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// AUDIT
// ============================================================
function AuditTab({ programId }: { programId: string }) {
  const { data: audit = [], isLoading } = useProgramAudit(programId);
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  return (
    <Card title={`Audit Log (${audit.length})`}>
      {audit.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">No audit events yet.</div>
      ) : (
        <div className="space-y-1">
          {audit.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 bg-muted/40 rounded px-3 py-1.5 text-xs">
              <span className="font-mono uppercase font-semibold text-muted-foreground w-16">{a.action}</span>
              <span className="font-medium">{a.field_name || '—'}</span>
              {a.old_value && <span className="text-muted-foreground line-through">{String(a.old_value).slice(0, 40)}</span>}
              {a.new_value && <span>→ {String(a.new_value).slice(0, 40)}</span>}
              <span className="text-muted-foreground ml-auto">{a.actor_name || 'system'} · {new Date(a.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// Shared UI
// ============================================================
function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <Input value={value} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} className="h-8 text-sm" />
    </div>
  );
}

function Area({ label, value, onChange, disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <Textarea value={value} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} rows={2} className="text-sm" />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
