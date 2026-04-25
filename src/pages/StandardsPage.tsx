import { useState, useEffect } from 'react';
import {
  useStandards, useCreateStandard, useUpdateStandard, useDeleteStandard,
  useOemSpecifications, useCreateOemSpecification, useUpdateOemSpecification, useDeleteOemSpecification,
  useConditioningProfiles, useCreateConditioningProfile, useUpdateConditioningProfile, useDeleteConditioningProfile,
} from '@/hooks/useReferenceData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, BookMarked, Factory, Thermometer } from 'lucide-react';
import { toast } from 'sonner';

const ORG_OPTIONS = ['ISO', 'JIS', 'ASTM', 'DIN', 'EN', 'AATCC', 'FMVSS', 'VDA', 'OEM'];
const REGION_OPTIONS = ['Global', 'Japan', 'NA', 'EU', 'ASEAN', 'China'];

export default function StandardsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Standards & Specifications</h1>
        <p className="text-sm text-muted-foreground">Manage test standards, OEM specifications, and conditioning profiles</p>
      </div>

      <Tabs defaultValue="standards">
        <TabsList>
          <TabsTrigger value="standards"><BookMarked className="h-3 w-3 mr-1" /> Standards</TabsTrigger>
          <TabsTrigger value="oem"><Factory className="h-3 w-3 mr-1" /> OEM Specs</TabsTrigger>
          <TabsTrigger value="conditioning"><Thermometer className="h-3 w-3 mr-1" /> Conditioning</TabsTrigger>
        </TabsList>

        <TabsContent value="standards"><StandardsTab /></TabsContent>
        <TabsContent value="oem"><OemSpecsTab /></TabsContent>
        <TabsContent value="conditioning"><ConditioningTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============ STANDARDS ============
type StandardRow = { id: string; code: string; version: string | null; title: string | null; organization: string | null; document_url: string | null };

function StandardsTab() {
  const { data: standards = [], isLoading } = useStandards();
  const createStandard = useCreateStandard();
  const updateStandard = useUpdateStandard();
  const deleteStandard = useDeleteStandard();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<StandardRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StandardRow | null>(null);
  const [form, setForm] = useState({ code: '', version: '', title: '', organization: 'ISO', document_url: '' });

  const handleCreate = async () => {
    if (!form.code.trim()) return;
    try {
      await createStandard.mutateAsync({ code: form.code, version: form.version || undefined, title: form.title || undefined, organization: form.organization, document_url: form.document_url || undefined });
      setForm({ code: '', version: '', title: '', organization: 'ISO', document_url: '' });
      setShowAdd(false);
      toast.success('Standard added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Standard</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Test Standard</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Code * (e.g., ISO 1421)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                <Input placeholder="Version (e.g., 2016)" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
              </div>
              <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Select value={form.organization} onValueChange={v => setForm(f => ({ ...f, organization: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Document URL (optional)" value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.code.trim() || createStandard.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Version</th><th className="px-3 py-2 text-left">Title</th><th className="px-3 py-2 text-left">Org</th><th className="px-3 py-2 w-20"></th></tr></thead>
            <tbody>
              {standards.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-mono font-medium">{s.code}</td>
                  <td className="px-3 py-2">{s.version || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{s.title || '—'}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{s.organization}</Badge></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing(s as StandardRow)} className="text-muted-foreground hover:text-foreground p-1" aria-label="Edit"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => setConfirmDelete(s as StandardRow)} className="text-destructive hover:text-destructive/80 p-1" aria-label="Delete"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {standards.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-xs">No standards registered</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <EditStandardDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSave={async (id, updates) => {
          try {
            await updateStandard.mutateAsync({ id, updates });
            toast.success('Standard updated');
            setEditing(null);
          } catch (e: any) { toast.error(e.message || 'Failed to update'); }
        }}
        isPending={updateStandard.isPending}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete standard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-mono font-medium">{confirmDelete?.code}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteStandard.mutateAsync(confirmDelete.id);
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

function EditStandardDialog({ row, onClose, onSave, isPending }: { row: StandardRow | null; onClose: () => void; onSave: (id: string, updates: Partial<StandardRow>) => void; isPending: boolean }) {
  const [form, setForm] = useState({ code: '', version: '', title: '', organization: 'ISO', document_url: '' });

  useEffect(() => {
    if (row) {
      setForm({
        code: row.code || '',
        version: row.version || '',
        title: row.title || '',
        organization: row.organization || 'ISO',
        document_url: row.document_url || '',
      });
    }
  }, [row]);

  if (!row) return null;

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Test Standard</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Code *" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            <Input placeholder="Version" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
          </div>
          <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Select value={form.organization} onValueChange={v => setForm(f => ({ ...f, organization: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORG_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Document URL (optional)" value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} />
          <Button
            onClick={() => onSave(row.id, {
              code: form.code,
              version: form.version || null,
              title: form.title || null,
              organization: form.organization || null,
              document_url: form.document_url || null,
            })}
            disabled={!form.code.trim() || isPending}
            className="w-full"
          >Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ OEM SPECS ============
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

      <EditOemDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSave={async (id, updates) => {
          try {
            await updateSpec.mutateAsync({ id, updates });
            toast.success('OEM Spec updated');
            setEditing(null);
          } catch (e: any) { toast.error(e.message || 'Failed to update'); }
        }}
        isPending={updateSpec.isPending}
      />

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

function EditOemDialog({ row, onClose, onSave, isPending }: { row: OemRow | null; onClose: () => void; onSave: (id: string, updates: Partial<OemRow>) => void; isPending: boolean }) {
  const [form, setForm] = useState({ oem_brand: '', spec_code: '', version: '', title: '', region: 'Global' });

  useEffect(() => {
    if (row) {
      setForm({
        oem_brand: row.oem_brand || '',
        spec_code: row.spec_code || '',
        version: row.version || '',
        title: row.title || '',
        region: row.region || 'Global',
      });
    }
  }, [row]);

  if (!row) return null;

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit OEM Specification</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="OEM Brand *" value={form.oem_brand} onChange={e => setForm(f => ({ ...f, oem_brand: e.target.value }))} />
            <Input placeholder="Spec Code *" value={form.spec_code} onChange={e => setForm(f => ({ ...f, spec_code: e.target.value }))} />
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
          <Button
            onClick={() => onSave(row.id, {
              oem_brand: form.oem_brand,
              spec_code: form.spec_code,
              version: form.version || null,
              title: form.title || null,
              region: form.region || null,
            })}
            disabled={!form.oem_brand.trim() || !form.spec_code.trim() || isPending}
            className="w-full"
          >Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ CONDITIONING ============
type CondRow = { id: string; name: string; temperature_c: number | null; humidity_percent: number | null; duration_hours: number | null; description: string | null };

function ConditioningTab() {
  const { data: profiles = [], isLoading } = useConditioningProfiles();
  const createProfile = useCreateConditioningProfile();
  const updateProfile = useUpdateConditioningProfile();
  const deleteProfile = useDeleteConditioningProfile();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CondRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CondRow | null>(null);
  const [form, setForm] = useState({ name: '', temperature_c: '', humidity_percent: '', duration_hours: '', description: '' });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createProfile.mutateAsync({
        name: form.name,
        temperature_c: form.temperature_c ? Number(form.temperature_c) : undefined,
        humidity_percent: form.humidity_percent ? Number(form.humidity_percent) : undefined,
        duration_hours: form.duration_hours ? Number(form.duration_hours) : undefined,
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
              <Input placeholder="Name * (e.g., Standard Atmosphere)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs text-muted-foreground">Temp (C)</label><Input type="number" placeholder="23" value={form.temperature_c} onChange={e => setForm(f => ({ ...f, temperature_c: e.target.value }))} /></div>
                <div><label className="text-xs text-muted-foreground">Humidity (%)</label><Input type="number" placeholder="50" value={form.humidity_percent} onChange={e => setForm(f => ({ ...f, humidity_percent: e.target.value }))} /></div>
                <div><label className="text-xs text-muted-foreground">Duration (hrs)</label><Input type="number" placeholder="24" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} /></div>
              </div>
              <Textarea placeholder="Description (e.g., 23±2°C, 50±5% RH, 24h)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.name.trim() || createProfile.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map(p => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{p.name}</CardTitle>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(p as CondRow)} className="text-muted-foreground hover:text-foreground p-1" aria-label="Edit"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => setConfirmDelete(p as CondRow)} className="text-destructive hover:text-destructive/80 p-1" aria-label="Delete"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs space-y-0.5">
                  <div className="flex gap-3 text-muted-foreground">
                    {p.temperature_c !== null && <span>{p.temperature_c}°C</span>}
                    {p.humidity_percent !== null && <span>{p.humidity_percent}% RH</span>}
                    {p.duration_hours !== null && <span>{p.duration_hours}h</span>}
                  </div>
                  {p.description && <p className="text-muted-foreground mt-1">{p.description}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
          {profiles.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No conditioning profiles registered</p>}
        </div>
      )}

      <EditConditioningDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSave={async (id, updates) => {
          try {
            await updateProfile.mutateAsync({ id, updates });
            toast.success('Profile updated');
            setEditing(null);
          } catch (e: any) { toast.error(e.message || 'Failed to update'); }
        }}
        isPending={updateProfile.isPending}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conditioning profile?</AlertDialogTitle>
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

function EditConditioningDialog({ row, onClose, onSave, isPending }: { row: CondRow | null; onClose: () => void; onSave: (id: string, updates: Partial<CondRow>) => void; isPending: boolean }) {
  const [form, setForm] = useState({ name: '', temperature_c: '', humidity_percent: '', duration_hours: '', description: '' });

  useEffect(() => {
    if (row) {
      setForm({
        name: row.name || '',
        temperature_c: row.temperature_c?.toString() ?? '',
        humidity_percent: row.humidity_percent?.toString() ?? '',
        duration_hours: row.duration_hours?.toString() ?? '',
        description: row.description || '',
      });
    }
  }, [row]);

  if (!row) return null;

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Conditioning Profile</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-xs text-muted-foreground">Temp (C)</label><Input type="number" value={form.temperature_c} onChange={e => setForm(f => ({ ...f, temperature_c: e.target.value }))} /></div>
            <div><label className="text-xs text-muted-foreground">Humidity (%)</label><Input type="number" value={form.humidity_percent} onChange={e => setForm(f => ({ ...f, humidity_percent: e.target.value }))} /></div>
            <div><label className="text-xs text-muted-foreground">Duration (hrs)</label><Input type="number" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} /></div>
          </div>
          <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Button
            onClick={() => onSave(row.id, {
              name: form.name,
              temperature_c: form.temperature_c ? Number(form.temperature_c) : null,
              humidity_percent: form.humidity_percent ? Number(form.humidity_percent) : null,
              duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
              description: form.description || null,
            })}
            disabled={!form.name.trim() || isPending}
            className="w-full"
          >Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
