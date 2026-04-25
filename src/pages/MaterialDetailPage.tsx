import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  useMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useMaterialSuppliers,
  useAddMaterialSupplier,
  useRemoveMaterialSupplier,
  useMaterialCertifications,
  useAddMaterialCertification,
  useDeleteMaterialCertification,
  useMaterialVersions,
  useCreateMaterialVersion,
  useApproveMaterialVersion,
  useMaterialTestPrograms,
  useAddMaterialTestProgram,
  useRemoveMaterialTestProgram,
  useMaterialTestHistory,
} from '@/hooks/useMaterials';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useTestPrograms } from '@/hooks/useTestPrograms';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, X, Check, Save, Trash2, FileCheck2, History, Layers, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import type { DbMaterialUpdate } from '@/hooks/useMaterials';
import { materialUpdateSchema, friendlyMaterialError } from '@/lib/validation/material';

const STRUCTURES = ['Woven', 'Knit', 'Nonwoven', 'Coated', 'Laminated', 'Composite', 'Film', 'Foam', 'Other'];
const STATUSES = ['Active', 'Draft', 'Archived', 'Obsolete'];
const CERT_TYPES = ['OEKO-TEX Standard 100', 'REACH', 'GRS', 'RCS', 'ISO 14001', 'ISO 9001', 'GOTS', 'Bluesign', 'CPSIA', 'Other'];

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: material, isLoading } = useMaterial(id ?? null);
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const [edits, setEdits] = useState<Partial<DbMaterialUpdate>>({});
  const set = <K extends keyof DbMaterialUpdate>(k: K, v: DbMaterialUpdate[K]) =>
    setEdits(prev => ({ ...prev, [k]: v }));
  const val = <K extends keyof DbMaterialUpdate>(k: K): DbMaterialUpdate[K] | undefined =>
    (edits[k] !== undefined ? edits[k] : (material?.[k as keyof typeof material] as DbMaterialUpdate[K] | undefined));

  const handleSave = async () => {
    if (!id || Object.keys(edits).length === 0) return;
    await updateMaterial.mutateAsync({ id, ...edits });
    setEdits({});
    toast.success('Material updated');
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteMaterial.mutateAsync(id);
    toast.success('Material deleted');
    navigate('/materials');
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!material) return <p className="text-sm text-muted-foreground">Material not found.</p>;

  const dirty = Object.keys(edits).length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2 h-7">
            <Link to="/materials"><ArrowLeft className="h-3.5 w-3.5 mr-1" /> Materials</Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{material.name}</h1>
            <Badge variant="outline">{material.material_type}</Badge>
            {material.structure && <Badge variant="secondary">{material.structure}</Badge>}
            <StatusBadge status={material.status} />
            <Badge variant="outline" className="text-[10px]">v{material.current_version}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {material.material_code ? `${material.material_code} • ` : ''}
            {material.composition || 'No composition specified'}
          </p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button size="sm" onClick={handleSave} disabled={updateMaterial.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save Changes
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete material?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{material.name}" and all related certifications, versions, supplier links and program recommendations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="construction">Construction</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="programs">Test Programs</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>

        {/* IDENTITY */}
        <TabsContent value="identity" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Identity & Classification</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Material Name *">
                <Input value={(val('name') as string) ?? ''} onChange={e => set('name', e.target.value)} />
              </Field>
              <Field label="Material Code">
                <Input value={(val('material_code') as string) ?? ''} onChange={e => set('material_code', e.target.value || null)} placeholder="e.g. FAB-001" />
              </Field>
              <Field label="Status">
                <Select value={(val('status') as string) ?? 'Active'} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Material Type">
                <Select value={(val('material_type') as string) ?? 'Fabric'} onValueChange={v => set('material_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Fabric', 'PVC', 'Leather', 'Film', 'Foam', 'Composite', 'Yarn', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sub-Type">
                <Input value={(val('sub_type') as string) ?? ''} onChange={e => set('sub_type', e.target.value || null)} placeholder="e.g. Twill, Jersey" />
              </Field>
              <Field label="Structure">
                <Select value={(val('structure') as string) ?? ''} onValueChange={v => set('structure', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{STRUCTURES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Composition">
                <Input value={(val('composition') as string) ?? ''} onChange={e => set('composition', e.target.value || null)} placeholder="e.g. 100% Polyester" />
              </Field>
              <Field label="Color">
                <Input value={(val('color') as string) ?? ''} onChange={e => set('color', e.target.value || null)} />
              </Field>
              <Field label="Pattern">
                <Input value={(val('pattern') as string) ?? ''} onChange={e => set('pattern', e.target.value || null)} placeholder="e.g. Solid, Heather" />
              </Field>
              <Field label="Finish">
                <Input value={(val('finish') as string) ?? ''} onChange={e => set('finish', e.target.value || null)} placeholder="e.g. Water repellent, FR" />
              </Field>
              <Field label="Country of Origin">
                <Input value={(val('country_of_origin') as string) ?? ''} onChange={e => set('country_of_origin', e.target.value || null)} />
              </Field>
              <Field label="Batch / Lot">
                <Input value={(val('batch_lot') as string) ?? ''} onChange={e => set('batch_lot', e.target.value || null)} />
              </Field>
              <Field label="Image URL" full>
                <Input value={(val('image_url') as string) ?? ''} onChange={e => set('image_url', e.target.value || null)} placeholder="https://..." />
              </Field>
              <Field label="Notes" full>
                <Textarea value={(val('notes') as string) ?? ''} onChange={e => set('notes', e.target.value || null)} rows={2} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONSTRUCTION */}
        <TabsContent value="construction" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Fabric Construction</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Weight (gsm)"><NumInput val={val('weight_gsm') as number | null} onChange={n => set('weight_gsm', n)} /></Field>
              <Field label="GSM Tolerance (±)"><NumInput val={val('gsm_tolerance') as number | null} onChange={n => set('gsm_tolerance', n)} /></Field>
              <Field label="Width (cm)"><NumInput val={val('width_cm') as number | null} onChange={n => set('width_cm', n)} /></Field>
              <Field label="Thickness (mm)"><NumInput val={val('thickness_mm') as number | null} onChange={n => set('thickness_mm', n)} /></Field>
              <Field label="Weave / Knit Pattern"><Input value={(val('weave_pattern') as string) ?? ''} onChange={e => set('weave_pattern', e.target.value || null)} placeholder="Plain, Twill 2/1, Jersey…" /></Field>
              <Field label="Layers"><NumInput val={val('layers') as number | null} onChange={n => set('layers', n)} /></Field>
              <Field label="Warp Yarn Count"><Input value={(val('warp_yarn_count') as string) ?? ''} onChange={e => set('warp_yarn_count', e.target.value || null)} placeholder="e.g. 30/1, 150D" /></Field>
              <Field label="Weft Yarn Count"><Input value={(val('weft_yarn_count') as string) ?? ''} onChange={e => set('weft_yarn_count', e.target.value || null)} placeholder="e.g. 30/1, 150D" /></Field>
              <Field label="Warp Density (per cm)"><NumInput val={val('warp_density_per_cm') as number | null} onChange={n => set('warp_density_per_cm', n)} /></Field>
              <Field label="Weft Density (per cm)"><NumInput val={val('weft_density_per_cm') as number | null} onChange={n => set('weft_density_per_cm', n)} /></Field>
              <Field label="Coating Type"><Input value={(val('coating_type') as string) ?? ''} onChange={e => set('coating_type', e.target.value || null)} placeholder="PU, PVC, Acrylic…" /></Field>
              <Field label="Coating Weight (gsm)"><NumInput val={val('coating_weight_gsm') as number | null} onChange={n => set('coating_weight_gsm', n)} /></Field>
              <Field label="Backing Material"><Input value={(val('backing_material') as string) ?? ''} onChange={e => set('backing_material', e.target.value || null)} /></Field>
              <Field label="Lamination"><Input value={(val('lamination') as string) ?? ''} onChange={e => set('lamination', e.target.value || null)} placeholder="TPU film, PE…" /></Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Performance Properties</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Stretch Warp (%)"><NumInput val={val('stretch_warp_percent') as number | null} onChange={n => set('stretch_warp_percent', n)} /></Field>
              <Field label="Stretch Weft (%)"><NumInput val={val('stretch_weft_percent') as number | null} onChange={n => set('stretch_weft_percent', n)} /></Field>
              <Field label="Abrasion Class"><Input value={(val('abrasion_class') as string) ?? ''} onChange={e => set('abrasion_class', e.target.value || null)} placeholder="e.g. >50k cycles" /></Field>
              <Field label="Water Repellency"><Input value={(val('water_repellency_rating') as string) ?? ''} onChange={e => set('water_repellency_rating', e.target.value || null)} placeholder="ISO 4920 / 5" /></Field>
              <Field label="Breathability"><Input value={(val('breathability_rating') as string) ?? ''} onChange={e => set('breathability_rating', e.target.value || null)} placeholder="MVTR g/m²/24h" /></Field>
              <Field label="Fire Retardant"><BoolSwitch checked={!!val('fire_retardant')} onChange={v => set('fire_retardant', v)} /></Field>
              <Field label="UV Stabilized"><BoolSwitch checked={!!val('uv_stabilized')} onChange={v => set('uv_stabilized', v)} /></Field>
              <Field label="Antimicrobial"><BoolSwitch checked={!!val('antimicrobial')} onChange={v => set('antimicrobial', v)} /></Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPLIANCE */}
        <TabsContent value="compliance" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Sustainability & Regulatory</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="REACH Compliant"><BoolSwitch checked={!!val('reach_compliant')} onChange={v => set('reach_compliant', v)} /></Field>
              <Field label="OEKO-TEX Class"><Input value={(val('oekotex_class') as string) ?? ''} onChange={e => set('oekotex_class', e.target.value || null)} placeholder="I, II, III, IV" /></Field>
              <Field label="Recycled Content (%)"><NumInput val={val('recycled_content_percent') as number | null} onChange={n => set('recycled_content_percent', n)} /></Field>
              <Field label="Approval Status">
                <Select value={(val('approval_status') as string) ?? 'Draft'} onValueChange={v => set('approval_status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Draft', 'Pending', 'Approved', 'Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CERTIFICATIONS */}
        <TabsContent value="certifications" className="mt-4">
          <CertificationsPanel materialId={id!} />
        </TabsContent>

        {/* SUPPLIERS */}
        <TabsContent value="suppliers" className="mt-4">
          <SuppliersPanel materialId={id!} />
        </TabsContent>

        {/* TEST PROGRAMS */}
        <TabsContent value="programs" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Default Test Program</CardTitle></CardHeader>
            <CardContent>
              <DefaultProgramPicker currentId={(val('default_test_program_id') as string) ?? null} onChange={v => set('default_test_program_id', v)} />
            </CardContent>
          </Card>
          <ProgramsPanel materialId={id!} />
        </TabsContent>

        {/* TEST HISTORY */}
        <TabsContent value="history" className="mt-4">
          <TestHistoryPanel materialId={id!} />
        </TabsContent>

        {/* VERSIONS */}
        <TabsContent value="versions" className="mt-4">
          <VersionsPanel materialId={id!} userEmail={user?.email ?? 'unknown'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Helper components ----------
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1 ${full ? 'md:col-span-full' : ''}`}>
      <Label className="text-[11px] uppercase text-muted-foreground tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function NumInput({ val, onChange }: { val: number | null | undefined; onChange: (n: number | null) => void }) {
  return (
    <Input
      type="number"
      value={val ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  );
}

function BoolSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center h-9">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="ml-2 text-xs text-muted-foreground">{checked ? 'Yes' : 'No'}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const variant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    Active: 'default', Draft: 'secondary', Archived: 'outline', Obsolete: 'destructive',
  };
  return <Badge variant={variant[status ?? 'Draft'] ?? 'outline'}>{status ?? 'Draft'}</Badge>;
}

// ---------- Certifications Panel ----------
function CertificationsPanel({ materialId }: { materialId: string }) {
  const { data: certs = [] } = useMaterialCertifications(materialId);
  const add = useAddMaterialCertification();
  const remove = useDeleteMaterialCertification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ certification_type: 'OEKO-TEX Standard 100', certificate_number: '', issuer: '', valid_from: '', valid_to: '', document_url: '', notes: '' });

  const handleAdd = async () => {
    if (!form.certification_type) return;
    await add.mutateAsync({
      material_id: materialId,
      certification_type: form.certification_type,
      certificate_number: form.certificate_number || null,
      issuer: form.issuer || null,
      valid_from: form.valid_from || null,
      valid_to: form.valid_to || null,
      document_url: form.document_url || null,
      notes: form.notes || null,
    });
    setForm({ certification_type: 'OEKO-TEX Standard 100', certificate_number: '', issuer: '', valid_from: '', valid_to: '', document_url: '', notes: '' });
    setOpen(false);
    toast.success('Certification added');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><FileCheck2 className="h-4 w-4" /> Certifications</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Certification</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.certification_type} onValueChange={v => setForm(f => ({ ...f, certification_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CERT_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Certificate Number" value={form.certificate_number} onChange={e => setForm(f => ({ ...f, certificate_number: e.target.value }))} />
              <Input placeholder="Issuer" value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Valid From</Label><Input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} /></div>
                <div><Label className="text-xs">Valid To</Label><Input type="date" value={form.valid_to} onChange={e => setForm(f => ({ ...f, valid_to: e.target.value }))} /></div>
              </div>
              <Input placeholder="Document URL" value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} />
              <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              <Button onClick={handleAdd} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Cert #</th><th className="px-3 py-2 text-left">Issuer</th><th className="px-3 py-2 text-left">Valid To</th><th className="px-3 py-2 w-10"></th></tr></thead>
            <tbody>
              {certs.map(c => {
                const expired = c.valid_to && new Date(c.valid_to) < new Date();
                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{c.certification_type}</td>
                    <td className="px-3 py-2 text-xs">{c.certificate_number || '—'}</td>
                    <td className="px-3 py-2 text-xs">{c.issuer || '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      {c.valid_to ? <span className={expired ? 'text-destructive' : ''}>{c.valid_to}{expired && ' (expired)'}</span> : '—'}
                    </td>
                    <td className="px-3 py-2"><button onClick={() => remove.mutate({ id: c.id, materialId })} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button></td>
                  </tr>
                );
              })}
              {certs.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-xs">No certifications recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Suppliers Panel ----------
function SuppliersPanel({ materialId }: { materialId: string }) {
  const { data: matSuppliers = [] } = useMaterialSuppliers(materialId);
  const { data: allSuppliers = [] } = useSuppliers();
  const add = useAddMaterialSupplier();
  const remove = useRemoveMaterialSupplier();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', grade: '', unit_price: '', notes: '' });

  const linkedIds = new Set(matSuppliers.map(ms => (ms as any).suppliers?.id));
  const available = allSuppliers.filter(s => !linkedIds.has(s.id));

  const handleAdd = async () => {
    if (!form.supplier_id) return;
    await add.mutateAsync({
      material_id: materialId, supplier_id: form.supplier_id,
      grade: form.grade || undefined,
      unit_price: form.unit_price ? Number(form.unit_price) : undefined,
      notes: form.notes || undefined,
    });
    setForm({ supplier_id: '', grade: '', unit_price: '', notes: '' });
    setOpen(false);
    toast.success('Supplier linked');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Linked Suppliers</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline" disabled={available.length === 0}><Plus className="h-3 w-3 mr-1" /> Link Supplier</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Link Supplier</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.supplier_id} onValueChange={v => setForm(f => ({ ...f, supplier_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                <SelectContent>{available.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Grade / Quality" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} />
              <Input placeholder="Unit Price" type="number" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} />
              <Input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button onClick={handleAdd} className="w-full">Link</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Supplier</th><th className="px-3 py-2 text-left">Grade</th><th className="px-3 py-2 text-left">Unit Price</th><th className="px-3 py-2 text-left">Notes</th><th className="px-3 py-2 w-10"></th></tr></thead>
            <tbody>
              {matSuppliers.map(ms => (
                <tr key={ms.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{(ms as any).suppliers?.name || '—'}</td>
                  <td className="px-3 py-2">{ms.grade || '—'}</td>
                  <td className="px-3 py-2 text-xs">{ms.unit_price ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{ms.notes || '—'}</td>
                  <td className="px-3 py-2"><button onClick={() => remove.mutate({ id: ms.id, materialId })} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button></td>
                </tr>
              ))}
              {matSuppliers.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-xs">No suppliers linked.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Programs ----------
function DefaultProgramPicker({ currentId, onChange }: { currentId: string | null; onChange: (id: string | null) => void }) {
  const { data: programs = [] } = useTestPrograms();
  return (
    <Select value={currentId ?? ''} onValueChange={v => onChange(v || null)}>
      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
      <SelectContent>
        {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function ProgramsPanel({ materialId }: { materialId: string }) {
  const { data: rows = [] } = useMaterialTestPrograms(materialId);
  const { data: allPrograms = [] } = useTestPrograms();
  const add = useAddMaterialTestProgram();
  const remove = useRemoveMaterialTestProgram();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ program_id: '', priority: '0', notes: '' });

  const linkedIds = new Set(rows.map(r => r.program_id));
  const available = allPrograms.filter(p => !linkedIds.has(p.id));

  const handleAdd = async () => {
    if (!form.program_id) return;
    await add.mutateAsync({ material_id: materialId, program_id: form.program_id, priority: Number(form.priority) || 0, notes: form.notes || undefined });
    setForm({ program_id: '', priority: '0', notes: '' });
    setOpen(false);
    toast.success('Program added');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Recommended Test Programs</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline" disabled={available.length === 0}><Plus className="h-3 w-3 mr-1" /> Add Program</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Recommend Test Program</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.program_id} onValueChange={v => setForm(f => ({ ...f, program_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                <SelectContent>{available.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Priority (0 = highest)" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} />
              <Input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button onClick={handleAdd} className="w-full">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Program</th><th className="px-3 py-2 text-left">Priority</th><th className="px-3 py-2 text-left">Notes</th><th className="px-3 py-2 w-10"></th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{(r as any).test_programs?.name || '—'}</td>
                  <td className="px-3 py-2 text-xs">{r.priority}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.notes || '—'}</td>
                  <td className="px-3 py-2"><button onClick={() => remove.mutate({ id: r.id, materialId })} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground text-xs">No recommended programs.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Test History ----------
function TestHistoryPanel({ materialId }: { materialId: string }) {
  const { data: rows = [], isLoading } = useMaterialTestHistory(materialId);
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Test History</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Sample ID</th><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-left">Supplier</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Result</th><th className="px-3 py-2 text-left">Date</th></tr></thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2"><Link to={`/tests/${s.id}`} className="text-primary hover:underline font-medium">{s.sample_id}</Link></td>
                    <td className="px-3 py-2 text-xs">{s.product_name}</td>
                    <td className="px-3 py-2 text-xs">{s.supplier_name || '—'}</td>
                    <td className="px-3 py-2 text-xs">{s.status || '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      {s.overall_judgment ? (
                        <Badge variant={s.overall_judgment === 'OK' ? 'default' : s.overall_judgment === 'NG' ? 'destructive' : 'secondary'}>
                          {s.overall_judgment}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground text-xs">No test history yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Versions ----------
function VersionsPanel({ materialId, userEmail }: { materialId: string; userEmail: string }) {
  const { data: versions = [] } = useMaterialVersions(materialId);
  const create = useCreateMaterialVersion();
  const approve = useApproveMaterialVersion();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const handleCreate = async () => {
    await create.mutateAsync({ materialId, changeNotes: notes, preparedBy: userEmail });
    setNotes('');
    setOpen(false);
    toast.success('Draft version created');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" /> Version History</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> New Draft</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Draft Version</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">A snapshot of the current material spec will be saved as a Draft version.</p>
              <Textarea placeholder="Change notes (what changed and why)" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              <Button onClick={handleCreate} className="w-full">Create Draft</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Ver</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Prepared</th><th className="px-3 py-2 text-left">Approved</th><th className="px-3 py-2 text-left">Effective</th><th className="px-3 py-2 text-left">Notes</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {versions.map(v => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2 font-mono">v{v.version_number}</td>
                  <td className="px-3 py-2"><Badge variant={v.status === 'Active' ? 'default' : v.status === 'Superseded' ? 'outline' : 'secondary'}>{v.status}</Badge></td>
                  <td className="px-3 py-2 text-xs">{v.prepared_by || '—'}</td>
                  <td className="px-3 py-2 text-xs">{v.approved_by || '—'}</td>
                  <td className="px-3 py-2 text-xs">{v.effective_date || '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{v.change_notes || '—'}</td>
                  <td className="px-3 py-2">
                    {v.status === 'Draft' && (
                      <Button size="sm" variant="outline" className="h-7" onClick={() => approve.mutate({ versionId: v.id, materialId, approvedBy: userEmail })}>
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {versions.length === 0 && <tr><td colSpan={7} className="px-3 py-4 text-center text-muted-foreground text-xs">No versions yet. Create the first draft to start the audit trail.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
