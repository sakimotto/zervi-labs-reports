import { useState } from 'react';
import { useMaterials, useCreateMaterial, useDeleteMaterial, useMaterialSuppliers, useAddMaterialSupplier, useRemoveMaterialSupplier } from '@/hooks/useMaterials';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useTestPrograms } from '@/hooks/useTestPrograms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowLeft, LinkIcon, X } from 'lucide-react';
import { toast } from 'sonner';

export default function MaterialsPage() {
  const { data: materials = [], isLoading } = useMaterials();
  const { data: programs = [] } = useTestPrograms();
  const createMaterial = useCreateMaterial();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', material_type: 'Fabric', weight_gsm: '', width_cm: '', composition: '', color: '', finish: '', default_test_program_id: '', notes: '' });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createMaterial.mutateAsync({
      name: form.name,
      material_type: form.material_type,
      weight_gsm: form.weight_gsm ? Number(form.weight_gsm) : undefined,
      width_cm: form.width_cm ? Number(form.width_cm) : undefined,
      composition: form.composition || undefined,
      color: form.color || undefined,
      finish: form.finish || undefined,
      default_test_program_id: form.default_test_program_id || undefined,
      notes: form.notes || undefined,
    });
    setForm({ name: '', material_type: 'Fabric', weight_gsm: '', width_cm: '', composition: '', color: '', finish: '', default_test_program_id: '', notes: '' });
    setShowAdd(false);
    toast.success('Material added');
  };

  if (selectedId) {
    return <MaterialDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material Database</h1>
          <p className="text-sm text-muted-foreground">Manage materials, specs, supplier links, and default test programs</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Material</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Material Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.material_type} onValueChange={v => setForm(f => ({ ...f, material_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Fabric', 'PVC', 'Leather', 'Film', 'Foam', 'Composite', 'Yarn', 'Other'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Composition" value={form.composition} onChange={e => setForm(f => ({ ...f, composition: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Weight (gsm)" type="number" value={form.weight_gsm} onChange={e => setForm(f => ({ ...f, weight_gsm: e.target.value }))} />
                <Input placeholder="Width (cm)" type="number" value={form.width_cm} onChange={e => setForm(f => ({ ...f, width_cm: e.target.value }))} />
                <Input placeholder="Color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              </div>
              <Input placeholder="Finish (e.g., Water repellent, FR)" value={form.finish} onChange={e => setForm(f => ({ ...f, finish: e.target.value }))} />
              <Select value={form.default_test_program_id} onValueChange={v => setForm(f => ({ ...f, default_test_program_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Default Test Program (optional)" /></SelectTrigger>
                <SelectContent>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.name.trim()} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {materials.map(mat => (
            <Card key={mat.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedId(mat.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{mat.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{mat.material_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {mat.composition && <p>{mat.composition}</p>}
                  {mat.weight_gsm && <p>{mat.weight_gsm} gsm</p>}
                  {(mat as any).test_programs?.name && <p className="text-primary">📋 {(mat as any).test_programs.name}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
          {materials.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No materials registered yet.</p>}
        </div>
      )}
    </div>
  );
}

function MaterialDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: materials = [] } = useMaterials();
  const mat = materials.find(m => m.id === id);
  const { data: matSuppliers = [] } = useMaterialSuppliers(id);
  const { data: allSuppliers = [] } = useSuppliers();
  const addSupplier = useAddMaterialSupplier();
  const removeSupplier = useRemoveMaterialSupplier();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkForm, setLinkForm] = useState({ supplier_id: '', grade: '', notes: '' });

  const linkedIds = new Set(matSuppliers.map(ms => (ms as any).suppliers?.id));
  const availableSuppliers = allSuppliers.filter(s => !linkedIds.has(s.id));

  const handleLink = async () => {
    if (!linkForm.supplier_id) return;
    await addSupplier.mutateAsync({ material_id: id, supplier_id: linkForm.supplier_id, grade: linkForm.grade || undefined, notes: linkForm.notes || undefined });
    setLinkForm({ supplier_id: '', grade: '', notes: '' });
    setShowLinkDialog(false);
    toast.success('Supplier linked');
  };

  if (!mat) return null;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <div>
        <h2 className="text-xl font-bold">{mat.name}</h2>
        <p className="text-sm text-muted-foreground">{mat.material_type} — {mat.composition || 'No composition specified'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {[
          ['Weight', mat.weight_gsm ? `${mat.weight_gsm} gsm` : '—'],
          ['Width', mat.width_cm ? `${mat.width_cm} cm` : '—'],
          ['Color', mat.color || '—'],
          ['Finish', mat.finish || '—'],
        ].map(([label, val]) => (
          <Card key={label as string} className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
            <p className="font-medium">{val}</p>
          </Card>
        ))}
      </div>

      {(mat as any).test_programs?.name && (
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Default Test Program</p>
          <p className="font-medium text-primary">{(mat as any).test_programs.name}</p>
        </Card>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Linked Suppliers</h3>
          <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={availableSuppliers.length === 0}><LinkIcon className="h-3 w-3 mr-1" /> Link Supplier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Link Supplier</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={linkForm.supplier_id} onValueChange={v => setLinkForm(f => ({ ...f, supplier_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                  <SelectContent>
                    {availableSuppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Grade / Quality" value={linkForm.grade} onChange={e => setLinkForm(f => ({ ...f, grade: e.target.value }))} />
                <Input placeholder="Notes" value={linkForm.notes} onChange={e => setLinkForm(f => ({ ...f, notes: e.target.value }))} />
                <Button onClick={handleLink} disabled={!linkForm.supplier_id} className="w-full">Link</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Supplier</th><th className="px-3 py-2 text-left">Grade</th><th className="px-3 py-2 text-left">Notes</th><th className="px-3 py-2 w-10"></th></tr></thead>
            <tbody>
              {matSuppliers.map(ms => (
                <tr key={ms.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{(ms as any).suppliers?.name || '—'}</td>
                  <td className="px-3 py-2">{ms.grade || '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{ms.notes || '—'}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeSupplier.mutate({ id: ms.id, materialId: id })} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
                  </td>
                </tr>
              ))}
              {matSuppliers.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground text-xs">No suppliers linked</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
