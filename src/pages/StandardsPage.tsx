import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useOemSpecifications, useCreateOemSpecification, useUpdateOemSpecification, useDeleteOemSpecification,
  useConditioningProfiles, useCreateConditioningProfile, useUpdateConditioningProfile, useDeleteConditioningProfile,
} from '@/hooks/useReferenceData';
import {
  useStandardsFull, useCreateStandardFull,
  useStandardsOrganizations, useCreateOrganization,
  useStandardsCategories, useCreateCategory,
  useStandardEquipmentReqs,
  useStandardParameters,
} from '@/hooks/useStandardsHub';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Trash2, Pencil, BookMarked, Factory, Thermometer,
  Building2, FolderTree, Wrench, Sliders, ExternalLink, Search,
} from 'lucide-react';
import { toast } from 'sonner';

const REGION_OPTIONS = ['Global', 'Japan', 'NA', 'EU', 'ASEAN', 'China'];
const STATUS_OPTIONS = ['Active', 'Withdrawn', 'Historical', 'Superseded', 'Draft'];
const STATUS_COLOR: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  Withdrawn: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  Historical: 'bg-zinc-500/15 text-zinc-700 border-zinc-500/30',
  Superseded: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  Draft: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
};

export default function StandardsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Standards Hub</h1>
        <p className="text-sm text-muted-foreground">
          Authoritative library of test standards, issuing organizations, categories, equipment requirements, and lab wiki notes.
        </p>
      </div>

      <Tabs defaultValue="standards">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="standards"><BookMarked className="h-3 w-3 mr-1" /> Standards</TabsTrigger>
          <TabsTrigger value="organizations"><Building2 className="h-3 w-3 mr-1" /> Organizations</TabsTrigger>
          <TabsTrigger value="categories"><FolderTree className="h-3 w-3 mr-1" /> Categories</TabsTrigger>
          <TabsTrigger value="equipment"><Wrench className="h-3 w-3 mr-1" /> Equipment</TabsTrigger>
          <TabsTrigger value="parameters"><Sliders className="h-3 w-3 mr-1" /> Parameters</TabsTrigger>
          <TabsTrigger value="oem"><Factory className="h-3 w-3 mr-1" /> OEM Specs</TabsTrigger>
          <TabsTrigger value="conditioning"><Thermometer className="h-3 w-3 mr-1" /> Conditioning</TabsTrigger>
        </TabsList>

        <TabsContent value="standards"><StandardsTab /></TabsContent>
        <TabsContent value="organizations"><OrganizationsTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="equipment"><EquipmentReqsTab /></TabsContent>
        <TabsContent value="parameters"><ParametersTab /></TabsContent>
        <TabsContent value="oem"><OemSpecsTab /></TabsContent>
        <TabsContent value="conditioning"><ConditioningTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============ STANDARDS TAB ============
function StandardsTab() {
  const { data: standards = [], isLoading } = useStandardsFull();
  const { data: orgs = [] } = useStandardsOrganizations();
  const createStandard = useCreateStandardFull();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form, setForm] = useState({
    code: '', version: '', title: '', organization_id: '', summary: '',
    document_url: '', status: 'Active', latest_revision_year: '',
  });

  const filtered = useMemo(() => {
    return standards.filter(s => {
      if (orgFilter !== 'all' && s.organization_id !== orgFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (s.code?.toLowerCase().includes(q) || s.title?.toLowerCase().includes(q) || s.full_designation?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [standards, search, orgFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: standards.length,
    active: standards.filter(s => s.status === 'Active').length,
    withdrawn: standards.filter(s => s.status === 'Withdrawn').length,
    orgs: new Set(standards.map(s => s.organization_id).filter(Boolean)).size,
  }), [standards]);

  const handleCreate = async () => {
    if (!form.code.trim()) return;
    const orgRow = orgs.find(o => o.id === form.organization_id);
    try {
      await createStandard.mutateAsync({
        code: form.code,
        version: form.version || null,
        title: form.title || null,
        organization: orgRow?.code ?? 'ISO',
        organization_id: form.organization_id || null,
        full_designation: form.version ? `${form.code}:${form.version}` : form.code,
        summary: form.summary || null,
        document_url: form.document_url || null,
        status: form.status,
        latest_revision_year: form.latest_revision_year ? parseInt(form.latest_revision_year, 10) : null,
      });
      setForm({ code: '', version: '', title: '', organization_id: '', summary: '', document_url: '', status: 'Active', latest_revision_year: '' });
      setShowAdd(false);
      toast.success('Standard added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  return (
    <div className="space-y-4 mt-3">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total" value={stats.total} />
        <KpiCard label="Active" value={stats.active} accent="text-emerald-600" />
        <KpiCard label="Withdrawn" value={stats.withdrawn} accent="text-rose-600" />
        <KpiCard label="Organizations" value={stats.orgs} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search code, title, designation…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Standard</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Add Test Standard</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Code * (e.g., ISO 1421)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                <Input placeholder="Version (e.g., 2016)" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
              </div>
              <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.organization_id || undefined} onValueChange={v => setForm(f => ({ ...f, organization_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Organization" /></SelectTrigger>
                  <SelectContent>
                    {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.code} — {o.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Latest revision year (e.g., 2023)" value={form.latest_revision_year} onChange={e => setForm(f => ({ ...f, latest_revision_year: e.target.value }))} />
              <Textarea placeholder="Short summary / scope (optional)" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={3} />
              <Input placeholder="Document URL (optional)" value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.code.trim() || createStandard.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs">
                <th className="px-3 py-2 text-left">Designation</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Org</th>
                <th className="px-3 py-2 text-left">Year</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link to={`/standards/${s.id}`} className="font-mono font-medium text-primary hover:underline">
                      {s.full_designation || s.code}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs max-w-md truncate">{s.title || s.summary || '—'}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{s.standards_organizations?.code || s.organization}</Badge></td>
                  <td className="px-3 py-2 text-xs">{s.latest_revision_year || s.first_published_year || '—'}</td>
                  <td className="px-3 py-2">
                    <Badge className={`text-[10px] border ${STATUS_COLOR[s.status] || ''}`} variant="outline">{s.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    {s.document_url && (
                      <a href={s.document_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground text-xs">No standards match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${accent || ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

// ============ ORGANIZATIONS TAB ============
function OrganizationsTab() {
  const { data: orgs = [], isLoading } = useStandardsOrganizations();
  const { data: standards = [] } = useStandardsFull();
  const createOrg = useCreateOrganization();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', full_name: '', country_origin: '', website_url: '', numbering_convention: '', notes: '' });

  const handleCreate = async () => {
    if (!form.code.trim() || !form.full_name.trim()) return;
    try {
      await createOrg.mutateAsync({
        code: form.code,
        full_name: form.full_name,
        country_origin: form.country_origin || null,
        website_url: form.website_url || null,
        numbering_convention: form.numbering_convention || null,
        notes: form.notes || null,
      });
      setForm({ code: '', full_name: '', country_origin: '', website_url: '', numbering_convention: '', notes: '' });
      setShowAdd(false);
      toast.success('Organization added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    standards.forEach(s => { if (s.organization_id) m.set(s.organization_id, (m.get(s.organization_id) || 0) + 1); });
    return m;
  }, [standards]);

  return (
    <div className="space-y-4 mt-3">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Organization</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Standards Organization</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Code * (e.g., ISO)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                <Input placeholder="Country" value={form.country_origin} onChange={e => setForm(f => ({ ...f, country_origin: e.target.value }))} />
              </div>
              <Input placeholder="Full name *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              <Input placeholder="Website URL" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} />
              <Input placeholder="Numbering convention (e.g., ISO NNNN:YYYY)" value={form.numbering_convention} onChange={e => setForm(f => ({ ...f, numbering_convention: e.target.value }))} />
              <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              <Button onClick={handleCreate} disabled={!form.code.trim() || !form.full_name.trim() || createOrg.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {orgs.map(o => (
            <Card key={o.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-mono">{o.code}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{o.full_name}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{counts.get(o.id) || 0} standards</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground">
                {o.country_origin && <div>📍 {o.country_origin}</div>}
                {o.numbering_convention && <div className="font-mono text-[10px]">{o.numbering_convention}</div>}
                {o.website_url && (
                  <a href={o.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
          {orgs.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No organizations yet</p>}
        </div>
      )}
    </div>
  );
}

// ============ CATEGORIES TAB ============
function CategoriesTab() {
  const { data: cats = [], isLoading } = useStandardsCategories();
  const createCat = useCreateCategory();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', parent_id: '', description: '', ics_code: '' });

  const tree = useMemo(() => {
    const roots = cats.filter(c => !c.parent_id);
    const childrenOf = (id: string) => cats.filter(c => c.parent_id === id);
    return { roots, childrenOf };
  }, [cats]);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    try {
      await createCat.mutateAsync({
        code: form.code,
        name: form.name,
        parent_id: form.parent_id || null,
        description: form.description || null,
        ics_code: form.ics_code || null,
      });
      setForm({ code: '', name: '', parent_id: '', description: '', ics_code: '' });
      setShowAdd(false);
      toast.success('Category added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  return (
    <div className="space-y-4 mt-3">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Standards Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Code * (e.g., FLAM)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                <Input placeholder="ICS code (e.g., 13.220)" value={form.ics_code} onChange={e => setForm(f => ({ ...f, ics_code: e.target.value }))} />
              </div>
              <Input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Select value={form.parent_id} onValueChange={v => setForm(f => ({ ...f, parent_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Parent (top-level if blank)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None (top-level)</SelectItem>
                  {cats.filter(c => !c.parent_id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              <Button onClick={handleCreate} disabled={!form.code.trim() || !form.name.trim() || createCat.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-3">
          {tree.roots.map(root => (
            <Card key={root.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{root.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">{root.code}</Badge>
                </div>
                {root.description && <CardDescription className="text-xs">{root.description}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0">
                {tree.childrenOf(root.id).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tree.childrenOf(root.id).map(child => (
                      <Badge key={child.id} variant="secondary" className="text-[10px]">{child.name}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No subcategories</p>
                )}
              </CardContent>
            </Card>
          ))}
          {tree.roots.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No categories yet</p>}
        </div>
      )}
    </div>
  );
}

// ============ EQUIPMENT REQUIREMENTS TAB ============
function EquipmentReqsTab() {
  const { data: reqs = [], isLoading } = useStandardEquipmentReqs();

  const grouped = useMemo(() => {
    const m = new Map<string, typeof reqs>();
    reqs.forEach(r => {
      const key = r.equipment_type;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [reqs]);

  return (
    <div className="space-y-4 mt-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Equipment Required by Standards</CardTitle>
          <CardDescription className="text-xs">All equipment requirements declared on standards. Add new ones from a standard's detail page.</CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No equipment requirements yet — open a standard's detail page to add.</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(([type, items]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{type}</CardTitle>
                <CardDescription className="text-xs">{items.length} standard{items.length === 1 ? '' : 's'} require this</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map(it => (
                    <div key={it.id} className="text-xs border rounded p-2 space-y-1">
                      {it.required_specifications && <div><span className="font-medium">Spec:</span> {it.required_specifications}</div>}
                      {it.specimen_size && <div><span className="font-medium">Specimen:</span> {it.specimen_size}</div>}
                      {it.test_conditions && <div><span className="font-medium">Conditions:</span> {it.test_conditions}</div>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ PARAMETERS TAB ============
function ParametersTab() {
  const { data: params = [], isLoading } = useStandardParameters();

  return (
    <div className="space-y-4 mt-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Sliders className="h-4 w-4" /> Standardized Parameters</CardTitle>
          <CardDescription className="text-xs">All measurement parameters declared across standards. Add new ones from a standard's detail page.</CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : params.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No parameters yet — open a standard's detail page to add.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs">
                <th className="px-3 py-2 text-left">Parameter</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-left">Range</th>
                <th className="px-3 py-2 text-left">Method</th>
              </tr>
            </thead>
            <tbody>
              {params.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{p.parameter_name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.unit || '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    {p.typical_range_min !== null || p.typical_range_max !== null
                      ? `${p.typical_range_min ?? '?'} – ${p.typical_range_max ?? '?'}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{p.measurement_method || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ OEM SPECS TAB (preserved) ============
type OemRow = { id: string; oem_brand: string; spec_code: string; version: string | null; title: string | null; region: string | null };

function OemSpecsTab() {
  const { data: specs = [], isLoading } = useOemSpecifications();
  const createSpec = useCreateOemSpecification();
  const updateSpec = useUpdateOemSpecification();
  const deleteSpec = useDeleteOemSpecification();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<OemRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OemRow | null>(null);
  const [form, setForm] = useState({ oem_brand: '', spec_code: '', version: '', title: '', region: 'Global' });

  const handleCreate = async () => {
    if (!form.oem_brand.trim() || !form.spec_code.trim()) return;
    try {
      await createSpec.mutateAsync({ oem_brand: form.oem_brand, spec_code: form.spec_code, version: form.version || undefined, title: form.title || undefined, region: form.region });
      setForm({ oem_brand: '', spec_code: '', version: '', title: '', region: 'Global' });
      setShowAdd(false);
      toast.success('OEM Specification added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add OEM Spec</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add OEM Specification</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="OEM Brand * (e.g., Nissan)" value={form.oem_brand} onChange={e => setForm(f => ({ ...f, oem_brand: e.target.value }))} />
                <Input placeholder="Spec Code * (e.g., NES M0154)" value={form.spec_code} onChange={e => setForm(f => ({ ...f, spec_code: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Version" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
                <Select value={form.region} onValueChange={v => setForm(f => ({ ...f, region: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REGION_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Title / Description" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.oem_brand.trim() || !form.spec_code.trim() || createSpec.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">OEM</th><th className="px-3 py-2 text-left">Spec Code</th><th className="px-3 py-2 text-left">Version</th><th className="px-3 py-2 text-left">Title</th><th className="px-3 py-2 text-left">Region</th><th className="px-3 py-2 w-20"></th></tr></thead>
            <tbody>
              {specs.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{s.oem_brand}</td>
                  <td className="px-3 py-2 font-mono">{s.spec_code}</td>
                  <td className="px-3 py-2">{s.version || '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.title || '—'}</td>
                  <td className="px-3 py-2"><Badge variant="secondary" className="text-[10px]">{s.region}</Badge></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing(s as OemRow)} className="text-muted-foreground hover:text-foreground p-1" aria-label="Edit"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => setConfirmDelete(s as OemRow)} className="text-destructive hover:text-destructive/80 p-1" aria-label="Delete"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {specs.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground text-xs">No OEM specifications registered</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete OEM specification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-mono font-medium">{confirmDelete?.oem_brand} / {confirmDelete?.spec_code}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteSpec.mutateAsync(confirmDelete.id);
                  toast.success('Deleted');
                } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
                setConfirmDelete(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============ CONDITIONING TAB (preserved) ============
type CondRow = { id: string; name: string; temperature_c: number | null; humidity_percent: number | null; duration_hours: number | null; description: string | null };

function ConditioningTab() {
  const { data: profiles = [], isLoading } = useConditioningProfiles();
  const createProfile = useCreateConditioningProfile();
  const updateProfile = useUpdateConditioningProfile();
  const deleteProfile = useDeleteConditioningProfile();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CondRow | null>(null);
  const [form, setForm] = useState({ name: '', temperature_c: '', humidity_percent: '', duration_hours: '', description: '' });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createProfile.mutateAsync({
        name: form.name,
        temperature_c: form.temperature_c ? parseFloat(form.temperature_c) : undefined,
        humidity_percent: form.humidity_percent ? parseFloat(form.humidity_percent) : undefined,
        duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : undefined,
        description: form.description || undefined,
      });
      setForm({ name: '', temperature_c: '', humidity_percent: '', duration_hours: '', description: '' });
      setShowAdd(false);
      toast.success('Conditioning profile added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Profile</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Conditioning Profile</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name * (e.g., Standard Atmosphere ISO 139)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Temp (°C)" type="number" value={form.temperature_c} onChange={e => setForm(f => ({ ...f, temperature_c: e.target.value }))} />
                <Input placeholder="RH (%)" type="number" value={form.humidity_percent} onChange={e => setForm(f => ({ ...f, humidity_percent: e.target.value }))} />
                <Input placeholder="Duration (hrs)" type="number" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} />
              </div>
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              <Button onClick={handleCreate} disabled={!form.name.trim() || createProfile.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {profiles.map(p => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{p.name}</CardTitle>
                  <button onClick={() => setConfirmDelete(p as CondRow)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="h-3 w-3" /></button>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1 text-muted-foreground">
                {p.temperature_c !== null && <div>🌡️ {p.temperature_c}°C</div>}
                {p.humidity_percent !== null && <div>💧 {p.humidity_percent}% RH</div>}
                {p.duration_hours !== null && <div>⏱️ {p.duration_hours} hrs</div>}
                {p.description && <div className="pt-1 border-t mt-2">{p.description}</div>}
              </CardContent>
            </Card>
          ))}
          {profiles.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No conditioning profiles yet</p>}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{confirmDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteProfile.mutateAsync(confirmDelete.id);
                  toast.success('Deleted');
                } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
                setConfirmDelete(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
