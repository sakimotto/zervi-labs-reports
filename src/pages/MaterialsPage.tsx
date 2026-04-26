import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMaterials, useCreateMaterial } from '@/hooks/useMaterials';
import { useTestPrograms } from '@/hooks/useTestPrograms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Flame, Sun, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { CardGridSkeleton, EmptyState } from '@/components/data/EmptyState';
import { Layers } from 'lucide-react';
import {
  materialCreateSchema,
  STRUCTURE_VALUES,
  TYPE_VALUES,
  friendlyMaterialError,
} from '@/lib/validation/material';

const STRUCTURES = STRUCTURE_VALUES;
const TYPES = TYPE_VALUES;

export default function MaterialsPage() {
  const { data: materials = [], isLoading } = useMaterials();
  const { data: programs = [] } = useTestPrograms();
  const createMaterial = useCreateMaterial();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStructure, setFilterStructure] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('Active');
  const [form, setForm] = useState({
    name: '', material_code: '', material_type: 'Fabric', structure: '',
    composition: '', weight_gsm: '', width_cm: '', color: '', finish: '',
    default_test_program_id: '', notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return materials.filter(m => {
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (filterType !== 'all' && m.material_type !== filterType) return false;
      if (filterStructure !== 'all' && m.structure !== filterStructure) return false;
      if (!q) return true;
      return [m.name, m.material_code, m.composition, m.color].some(v => v?.toLowerCase().includes(q));
    });
  }, [materials, search, filterType, filterStructure, filterStatus]);

  const handleCreate = async () => {
    // Client-side validation
    const parsed = materialCreateSchema.safeParse({
      name: form.name,
      material_code: form.material_code,
      material_type: form.material_type,
      structure: form.structure,
      composition: form.composition,
      weight_gsm: form.weight_gsm,
      width_cm: form.width_cm,
      color: form.color,
      finish: form.finish,
      notes: form.notes,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? '_';
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }
    setErrors({});
    const v = parsed.data;
    try {
      const created = await createMaterial.mutateAsync({
        name: v.name,
        material_code: v.material_code || null,
        material_type: v.material_type,
        structure: v.structure || null,
        composition: v.composition || null,
        weight_gsm: v.weight_gsm ?? null,
        width_cm: v.width_cm ?? null,
        color: v.color || null,
        finish: v.finish || null,
        default_test_program_id: form.default_test_program_id || null,
        notes: v.notes || null,
      });
      setForm({ name: '', material_code: '', material_type: 'Fabric', structure: '', composition: '', weight_gsm: '', width_cm: '', color: '', finish: '', default_test_program_id: '', notes: '' });
      setShowAdd(false);
      toast.success(`Material "${created.name}" added`);
    } catch (err) {
      toast.error(friendlyMaterialError(err as { message?: string }));
    }
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Lab Resources"
        title="Material Database"
        description="Detailed textile specifications, certifications, suppliers, and version control."
        actions={
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8"><Plus className="h-4 w-4 mr-1" /> Add Material</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Register Material</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Material Name *</Label>
                  <Input aria-invalid={!!errors.name} className={errors.name ? 'border-destructive' : ''} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  {errors.name && <p className="text-[11px] text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
                </div>
                <div>
                  <Label className="text-xs">Material Code</Label>
                  <Input aria-invalid={!!errors.material_code} className={errors.material_code ? 'border-destructive' : ''} placeholder="e.g. FAB-001" value={form.material_code} onChange={e => setForm(f => ({ ...f, material_code: e.target.value }))} />
                  {errors.material_code && <p className="text-[11px] text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.material_code}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Type *</Label>
                  <Select value={form.material_type} onValueChange={v => setForm(f => ({ ...f, material_type: v }))}>
                    <SelectTrigger className={errors.material_type ? 'border-destructive' : ''}><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.material_type && <p className="text-[11px] text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.material_type}</p>}
                </div>
                <div>
                  <Label className="text-xs">Structure</Label>
                  <Select value={form.structure} onValueChange={v => setForm(f => ({ ...f, structure: v }))}>
                    <SelectTrigger className={errors.structure ? 'border-destructive' : ''}><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{STRUCTURES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.structure && <p className="text-[11px] text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.structure}</p>}
                </div>
                <div>
                  <Label className="text-xs">Composition</Label>
                  <Input aria-invalid={!!errors.composition} className={errors.composition ? 'border-destructive' : ''} placeholder="100% Polyester" value={form.composition} onChange={e => setForm(f => ({ ...f, composition: e.target.value }))} />
                  {errors.composition && <p className="text-[11px] text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.composition}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Weight (gsm)</Label>
                  <Input type="number" min={0} max={10000} aria-invalid={!!errors.weight_gsm} className={errors.weight_gsm ? 'border-destructive' : ''} value={form.weight_gsm} onChange={e => setForm(f => ({ ...f, weight_gsm: e.target.value }))} />
                  {errors.weight_gsm && <p className="text-[11px] text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.weight_gsm}</p>}
                </div>
                <div>
                  <Label className="text-xs">Width (cm)</Label>
                  <Input type="number" min={0} max={1000} aria-invalid={!!errors.width_cm} className={errors.width_cm ? 'border-destructive' : ''} value={form.width_cm} onChange={e => setForm(f => ({ ...f, width_cm: e.target.value }))} />
                  {errors.width_cm && <p className="text-[11px] text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.width_cm}</p>}
                </div>
                <div><Label className="text-xs">Color</Label><Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
                <div><Label className="text-xs">Finish</Label><Input placeholder="WR, FR…" value={form.finish} onChange={e => setForm(f => ({ ...f, finish: e.target.value }))} /></div>
              </div>
              <div>
                <Label className="text-xs">Default Test Program</Label>
                <Select value={form.default_test_program_id} onValueChange={v => setForm(f => ({ ...f, default_test_program_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea aria-invalid={!!errors.notes} className={errors.notes ? 'border-destructive' : ''} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                {errors.notes && <p className="text-[11px] text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.notes}</p>}
              </div>
              <p className="text-xs text-muted-foreground">More detailed specs (yarn count, performance, certifications) can be added on the detail page after creation.</p>
              <Button onClick={handleCreate} disabled={createMaterial.isPending} className="w-full">Save & Open Detail</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by name, code, composition, color…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['Active', 'Draft', 'Archived', 'Obsolete'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStructure} onValueChange={setFilterStructure}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All structures</SelectItem>
            {STRUCTURES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(mat => (
            <Link key={mat.id} to={`/materials/${mat.id}`} className="block">
              <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">{mat.name}</CardTitle>
                      {mat.material_code && <p className="text-[10px] text-muted-foreground font-mono">{mat.material_code}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{mat.material_type}</Badge>
                      {mat.structure && <Badge variant="secondary" className="text-[10px]">{mat.structure}</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {mat.composition && <p className="truncate">{mat.composition}</p>}
                    <p>
                      {mat.weight_gsm ? `${mat.weight_gsm} gsm` : '—'}
                      {mat.width_cm ? ` • ${mat.width_cm} cm` : ''}
                      {mat.thickness_mm ? ` • ${mat.thickness_mm} mm` : ''}
                    </p>
                    {(mat as any).test_programs?.name && <p className="text-primary truncate">📋 {(mat as any).test_programs.name}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {mat.fire_retardant && <Badge variant="outline" className="text-[10px] gap-1"><Flame className="h-2.5 w-2.5" /> FR</Badge>}
                    {mat.uv_stabilized && <Badge variant="outline" className="text-[10px] gap-1"><Sun className="h-2.5 w-2.5" /> UV</Badge>}
                    {mat.antimicrobial && <Badge variant="outline" className="text-[10px] gap-1"><Shield className="h-2.5 w-2.5" /> AM</Badge>}
                    {mat.status !== 'Active' && <Badge variant="secondary" className="text-[10px]">{mat.status}</Badge>}
                    <Badge variant="outline" className="text-[10px] ml-auto">v{mat.current_version}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">
              {materials.length === 0 ? 'No materials registered yet.' : 'No materials match your filters.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
