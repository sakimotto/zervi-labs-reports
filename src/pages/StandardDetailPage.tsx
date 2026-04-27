import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useStandardDetail, useUpdateStandardFull, useSaveWikiNotes,
  useStandardWikiRevisions, useStandardRevisions,
  useStandardLinkedMethods, useStandardCategoryLinks,
  useStandardParameters, useCreateParameter, useDeleteParameter,
  useStandardEquipmentReqs, useCreateEquipmentReq, useDeleteEquipmentReq,
  useStandardsOrganizations,
} from '@/hooks/useStandardsHub';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ArrowLeft, BookOpen, History, FlaskConical, Wrench, Sliders, Save,
  ExternalLink, Plus, Trash2, Pencil, FileText, GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLOR: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  Withdrawn: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  Historical: 'bg-zinc-500/15 text-zinc-700 border-zinc-500/30',
  Superseded: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  Draft: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
};
const STATUS_OPTIONS = ['Active', 'Withdrawn', 'Historical', 'Superseded', 'Draft'];

export default function StandardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: standard, isLoading } = useStandardDetail(id);
  const { data: orgs = [] } = useStandardsOrganizations();
  const updateStandard = useUpdateStandardFull();
  const [editMode, setEditMode] = useState(false);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!standard) return <div className="p-6 text-sm text-muted-foreground">Standard not found</div>;

  const designation = standard.full_designation || standard.code;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/standards')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Standards Hub
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-2xl font-mono">{designation}</CardTitle>
                <Badge className={`text-xs border ${STATUS_COLOR[standard.status] || ''}`} variant="outline">{standard.status}</Badge>
                {standard.standards_organizations && (
                  <Badge variant="outline" className="text-xs">{standard.standards_organizations.code}</Badge>
                )}
              </div>
              {standard.title && <CardDescription className="text-base">{standard.title}</CardDescription>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1">
                {standard.standards_organizations && (
                  <span>Issued by <strong>{standard.standards_organizations.full_name}</strong>{standard.standards_organizations.country_origin ? ` (${standard.standards_organizations.country_origin})` : ''}</span>
                )}
                {standard.latest_revision_year && <span>• Latest revision <strong>{standard.latest_revision_year}</strong></span>}
                {standard.first_published_year && standard.first_published_year !== standard.latest_revision_year && <span>• First published {standard.first_published_year}</span>}
                {standard.language && <span>• {standard.language.toUpperCase()}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {standard.document_url && (
                <a href={standard.document_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1" /> Source</Button>
                </a>
              )}
              <Button variant={editMode ? 'default' : 'outline'} size="sm" onClick={() => setEditMode(!editMode)}>
                <Pencil className="h-4 w-4 mr-1" /> {editMode ? 'Done' : 'Edit metadata'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {editMode && (
          <CardContent className="border-t pt-4">
            <MetadataEditor
              standard={standard}
              orgs={orgs}
              onSave={async (updates) => {
                try {
                  await updateStandard.mutateAsync({ id: standard.id, updates });
                  toast.success('Metadata updated');
                  setEditMode(false);
                } catch (e: any) { toast.error(e.message || 'Failed to update'); }
              }}
              isPending={updateStandard.isPending}
            />
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview"><FileText className="h-3 w-3 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="wiki"><BookOpen className="h-3 w-3 mr-1" /> Wiki Notes</TabsTrigger>
          <TabsTrigger value="methods"><FlaskConical className="h-3 w-3 mr-1" /> Linked Methods</TabsTrigger>
          <TabsTrigger value="parameters"><Sliders className="h-3 w-3 mr-1" /> Parameters</TabsTrigger>
          <TabsTrigger value="equipment"><Wrench className="h-3 w-3 mr-1" /> Equipment</TabsTrigger>
          <TabsTrigger value="history"><History className="h-3 w-3 mr-1" /> Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab standardId={standard.id} standard={standard} /></TabsContent>
        <TabsContent value="wiki"><WikiTab standardId={standard.id} initial={standard.wiki_notes_md || ''} /></TabsContent>
        <TabsContent value="methods"><MethodsTab standardId={standard.id} /></TabsContent>
        <TabsContent value="parameters"><ParametersTab standardId={standard.id} /></TabsContent>
        <TabsContent value="equipment"><EquipmentTab standardId={standard.id} /></TabsContent>
        <TabsContent value="history"><HistoryTab standardId={standard.id} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Metadata Editor ============
function MetadataEditor({ standard, orgs, onSave, isPending }: { standard: any; orgs: any[]; onSave: (updates: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    code: standard.code || '',
    version: standard.version || '',
    title: standard.title || '',
    organization_id: standard.organization_id || '',
    status: standard.status || 'Active',
    summary: standard.summary || '',
    scope_description: standard.scope_description || '',
    document_url: standard.document_url || '',
    first_published_year: standard.first_published_year?.toString() || '',
    latest_revision_year: standard.latest_revision_year?.toString() || '',
    normative_references: standard.normative_references || '',
    source_attribution: standard.source_attribution || '',
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Code</label>
          <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Version</label>
          <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Title</label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Organization</label>
          <Select value={form.organization_id} onValueChange={v => setForm(f => ({ ...f, organization_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.code} — {o.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Status</label>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">First published year</label>
          <Input type="number" value={form.first_published_year} onChange={e => setForm(f => ({ ...f, first_published_year: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Latest revision year</label>
          <Input type="number" value={form.latest_revision_year} onChange={e => setForm(f => ({ ...f, latest_revision_year: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Summary</label>
        <Textarea rows={2} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Scope description</label>
        <Textarea rows={3} value={form.scope_description} onChange={e => setForm(f => ({ ...f, scope_description: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Normative references</label>
        <Textarea rows={2} value={form.normative_references} onChange={e => setForm(f => ({ ...f, normative_references: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Document URL</label>
        <Input value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Source attribution</label>
        <Input value={form.source_attribution} onChange={e => setForm(f => ({ ...f, source_attribution: e.target.value }))} placeholder="e.g., 'Kimi K2 deep research, 2026-04'" />
      </div>
      <Button
        className="w-full"
        disabled={isPending}
        onClick={() => onSave({
          ...form,
          first_published_year: form.first_published_year ? parseInt(form.first_published_year, 10) : null,
          latest_revision_year: form.latest_revision_year ? parseInt(form.latest_revision_year, 10) : null,
          full_designation: form.version ? `${form.code}:${form.version}` : form.code,
          organization_id: form.organization_id || null,
        })}
      >
        <Save className="h-4 w-4 mr-1" /> Save metadata
      </Button>
    </div>
  );
}

// ============ Overview ============
function OverviewTab({ standardId, standard }: { standardId: string; standard: any }) {
  const { data: cats = [] } = useStandardCategoryLinks(standardId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-3">
          {standard.summary ? (
            <p className="leading-relaxed">{standard.summary}</p>
          ) : (
            <p className="text-muted-foreground italic text-xs">No summary recorded yet. Use "Edit metadata" to add one.</p>
          )}
          {standard.scope_description && (
            <div className="pt-3 border-t">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Scope</div>
              <p className="leading-relaxed text-sm">{standard.scope_description}</p>
            </div>
          )}
          {standard.normative_references && (
            <div className="pt-3 border-t">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Normative References</div>
              <p className="text-xs whitespace-pre-line">{standard.normative_references}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Identity</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1.5">
            <KV label="Designation" value={standard.full_designation || standard.code} mono />
            <KV label="Status" value={standard.status} />
            <KV label="Document type" value={standard.document_type} />
            <KV label="Language" value={standard.language?.toUpperCase()} />
            <KV label="First published" value={standard.first_published_year} />
            <KV label="Latest revision" value={standard.latest_revision_year} />
            {standard.withdrawal_date && <KV label="Withdrawn" value={standard.withdrawal_date} />}
            {standard.superseded_by && (
              <KV
                label="Superseded by"
                value={
                  <Link to={`/standards/${standard.superseded_by.id}`} className="text-primary hover:underline font-mono">
                    {standard.superseded_by.full_designation || standard.superseded_by.code}
                  </Link>
                }
              />
            )}
            {standard.last_verified_date && <KV label="Last verified" value={standard.last_verified_date} />}
            {standard.source_attribution && <KV label="Source" value={standard.source_attribution} />}
          </CardContent>
        </Card>

        {cats.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {cats.map((c: any) => (
                  <Badge key={c.id} variant={c.is_primary ? 'default' : 'secondary'} className="text-[10px]">
                    {c.category?.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}

// ============ Wiki ============
function WikiTab({ standardId, initial }: { standardId: string; initial: string }) {
  const [content, setContent] = useState(initial);
  const [summary, setSummary] = useState('');
  const [dirty, setDirty] = useState(false);
  const save = useSaveWikiNotes();
  const { data: revisions = [] } = useStandardWikiRevisions(standardId);

  useEffect(() => { setContent(initial); setDirty(false); }, [initial]);

  const handleSave = async () => {
    try {
      await save.mutateAsync({ standardId, content, summary });
      toast.success('Wiki notes saved');
      setSummary('');
      setDirty(false);
    } catch (e: any) { toast.error(e.message || 'Failed to save'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Lab Wiki Notes</CardTitle>
            {dirty && <Badge variant="secondary" className="text-[10px]">Unsaved changes</Badge>}
          </div>
          <CardDescription className="text-xs">Free-form markdown commentary used by your lab. Every save is snapshotted into the revision history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={content}
            onChange={e => { setContent(e.target.value); setDirty(true); }}
            rows={20}
            className="font-mono text-xs"
            placeholder="# Internal notes&#10;&#10;Use markdown to capture: lab-specific interpretations, common pitfalls, OEM overrides, sample prep tips…"
          />
          <div className="flex items-center gap-2">
            <Input
              placeholder="Edit summary (e.g., 'Added clarification on specimen prep')"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSave} disabled={!dirty || save.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Edit History</CardTitle></CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No edits yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {revisions.map((r: any) => (
                <div key={r.id} className="text-xs border-l-2 border-muted pl-2 py-1">
                  <div className="font-medium">{r.edited_by_name || 'Unknown'}</div>
                  <div className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  {r.edit_summary && <div className="text-muted-foreground italic mt-0.5">"{r.edit_summary}"</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Linked methods ============
function MethodsTab({ standardId }: { standardId: string }) {
  const { data: links = [], isLoading } = useStandardLinkedMethods(standardId);

  if (isLoading) return <p className="text-sm text-muted-foreground mt-3">Loading…</p>;

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Test methods using this standard</CardTitle>
        <CardDescription className="text-xs">{links.length} method{links.length === 1 ? '' : 's'} linked</CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No test methods reference this standard yet.</p>
        ) : (
          <div className="space-y-1.5">
            {links.map((l: any) => l.method && (
              <Link
                key={l.id}
                to={`/test-methods/${l.method.id}`}
                className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 text-sm"
              >
                <div>
                  <span className="font-mono font-medium">{l.method.code}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{l.method.title}</span>
                </div>
                {l.is_primary && <Badge variant="default" className="text-[10px]">Primary</Badge>}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Parameters ============
function ParametersTab({ standardId }: { standardId: string }) {
  const { data: params = [], isLoading } = useStandardParameters(standardId);
  const create = useCreateParameter();
  const del = useDeleteParameter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ parameter_name: '', unit: '', measurement_method: '', typical_range_min: '', typical_range_max: '', notes: '' });

  const handleCreate = async () => {
    if (!form.parameter_name.trim()) return;
    try {
      await create.mutateAsync({
        standard_id: standardId,
        parameter_name: form.parameter_name,
        unit: form.unit || null,
        measurement_method: form.measurement_method || null,
        typical_range_min: form.typical_range_min ? parseFloat(form.typical_range_min) : null,
        typical_range_max: form.typical_range_max ? parseFloat(form.typical_range_max) : null,
        notes: form.notes || null,
      });
      setForm({ parameter_name: '', unit: '', measurement_method: '', typical_range_min: '', typical_range_max: '', notes: '' });
      setShowAdd(false);
      toast.success('Parameter added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Measurement Parameters</CardTitle>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Parameter</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Input placeholder="Parameter name * (e.g., Tensile strength)" value={form.parameter_name} onChange={e => setForm(f => ({ ...f, parameter_name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Unit (e.g., N/cm)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                  <Input placeholder="Method (e.g., Strip test)" value={form.measurement_method} onChange={e => setForm(f => ({ ...f, measurement_method: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Range min" value={form.typical_range_min} onChange={e => setForm(f => ({ ...f, typical_range_min: e.target.value }))} />
                  <Input type="number" placeholder="Range max" value={form.typical_range_max} onChange={e => setForm(f => ({ ...f, typical_range_max: e.target.value }))} />
                </div>
                <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                <Button onClick={handleCreate} disabled={!form.parameter_name.trim() || create.isPending} className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : params.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No parameters defined yet.</p>
        ) : (
          <div className="space-y-2">
            {params.map(p => (
              <div key={p.id} className="border rounded p-2.5 text-xs">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-sm">{p.parameter_name}</div>
                    <div className="text-muted-foreground">
                      {p.unit && <span className="font-mono">{p.unit}</span>}
                      {(p.typical_range_min !== null || p.typical_range_max !== null) && (
                        <span className="ml-2">Range: {p.typical_range_min ?? '?'} – {p.typical_range_max ?? '?'}</span>
                      )}
                    </div>
                    {p.measurement_method && <div className="text-muted-foreground">Method: {p.measurement_method}</div>}
                    {p.notes && <div className="mt-1">{p.notes}</div>}
                  </div>
                  <button onClick={() => del.mutate(p.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Equipment ============
function EquipmentTab({ standardId }: { standardId: string }) {
  const { data: reqs = [], isLoading } = useStandardEquipmentReqs(standardId);
  const create = useCreateEquipmentReq();
  const del = useDeleteEquipmentReq();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ equipment_type: '', manufacturer_examples: '', required_specifications: '', specimen_size: '', test_conditions: '', calibration_requirements: '' });

  const handleCreate = async () => {
    if (!form.equipment_type.trim()) return;
    try {
      await create.mutateAsync({
        standard_id: standardId,
        equipment_type: form.equipment_type,
        manufacturer_examples: form.manufacturer_examples || null,
        required_specifications: form.required_specifications || null,
        specimen_size: form.specimen_size || null,
        test_conditions: form.test_conditions || null,
        calibration_requirements: form.calibration_requirements || null,
      });
      setForm({ equipment_type: '', manufacturer_examples: '', required_specifications: '', specimen_size: '', test_conditions: '', calibration_requirements: '' });
      setShowAdd(false);
      toast.success('Equipment requirement added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Equipment Requirements</CardTitle>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Equipment Requirement</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Input placeholder="Equipment type * (e.g., Crockmeter)" value={form.equipment_type} onChange={e => setForm(f => ({ ...f, equipment_type: e.target.value }))} />
                <Input placeholder="Manufacturer examples (e.g., Atlas, James Heal)" value={form.manufacturer_examples} onChange={e => setForm(f => ({ ...f, manufacturer_examples: e.target.value }))} />
                <Textarea placeholder="Required specifications" rows={2} value={form.required_specifications} onChange={e => setForm(f => ({ ...f, required_specifications: e.target.value }))} />
                <Input placeholder="Specimen size (e.g., 50×140 mm)" value={form.specimen_size} onChange={e => setForm(f => ({ ...f, specimen_size: e.target.value }))} />
                <Input placeholder="Test conditions (e.g., 23°C / 50% RH)" value={form.test_conditions} onChange={e => setForm(f => ({ ...f, test_conditions: e.target.value }))} />
                <Input placeholder="Calibration requirements" value={form.calibration_requirements} onChange={e => setForm(f => ({ ...f, calibration_requirements: e.target.value }))} />
                <Button onClick={handleCreate} disabled={!form.equipment_type.trim() || create.isPending} className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : reqs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No equipment requirements defined yet.</p>
        ) : (
          <div className="space-y-2">
            {reqs.map((r: any) => (
              <div key={r.id} className="border rounded p-2.5 text-xs space-y-1">
                <div className="flex items-start justify-between">
                  <div className="font-medium text-sm">{r.equipment_type}</div>
                  <button onClick={() => del.mutate(r.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="h-3 w-3" /></button>
                </div>
                {r.manufacturer_examples && <div className="text-muted-foreground">Examples: {r.manufacturer_examples}</div>}
                {r.required_specifications && <div><span className="font-medium">Spec:</span> {r.required_specifications}</div>}
                {r.specimen_size && <div><span className="font-medium">Specimen:</span> {r.specimen_size}</div>}
                {r.test_conditions && <div><span className="font-medium">Conditions:</span> {r.test_conditions}</div>}
                {r.calibration_requirements && <div><span className="font-medium">Cal:</span> {r.calibration_requirements}</div>}
                {r.equipment && (
                  <Link to={`/equipment/${r.equipment.id}`} className="text-primary hover:underline inline-flex items-center gap-1 pt-0.5">
                    Linked: {r.equipment.name} <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ History ============
function HistoryTab({ standardId }: { standardId: string }) {
  const { data: revisions = [], isLoading } = useStandardRevisions(standardId);

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><GitBranch className="h-4 w-4" /> Version History</CardTitle>
        <CardDescription className="text-xs">Supersession chain, withdrawal dates, and change log</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : revisions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No revision history recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {revisions.map((r: any) => (
              <div key={r.id} className="border-l-2 border-primary pl-3 py-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-sm">{r.revision_label}</span>
                  {r.revision_year && <span className="text-xs text-muted-foreground">({r.revision_year})</span>}
                  {r.revision_type && <Badge variant="outline" className="text-[10px]">{r.revision_type}</Badge>}
                </div>
                {r.change_summary && <p className="text-xs text-muted-foreground mt-1">{r.change_summary}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
