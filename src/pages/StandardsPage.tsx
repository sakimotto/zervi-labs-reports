import { useState } from 'react';
import { useStandards, useCreateStandard, useDeleteStandard, useOemSpecifications, useCreateOemSpecification, useDeleteOemSpecification, useConditioningProfiles, useCreateConditioningProfile, useDeleteConditioningProfile } from '@/hooks/useReferenceData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, BookMarked, Factory, Thermometer } from 'lucide-react';
import { toast } from 'sonner';

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

function StandardsTab() {
  const { data: standards = [], isLoading } = useStandards();
  const createStandard = useCreateStandard();
  const deleteStandard = useDeleteStandard();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', version: '', title: '', organization: 'ISO', document_url: '' });

  const handleCreate = async () => {
    if (!form.code.trim()) return;
    await createStandard.mutateAsync({ code: form.code, version: form.version || undefined, title: form.title || undefined, organization: form.organization, document_url: form.document_url || undefined });
    setForm({ code: '', version: '', title: '', organization: 'ISO', document_url: '' });
    setShowAdd(false);
    toast.success('Standard added');
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
                  {['ISO', 'JIS', 'ASTM', 'DIN', 'EN', 'AATCC', 'FMVSS', 'VDA', 'OEM'].map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Document URL (optional)" value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.code.trim()} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Version</th><th className="px-3 py-2 text-left">Title</th><th className="px-3 py-2 text-left">Org</th><th className="px-3 py-2 w-10"></th></tr></thead>
            <tbody>
              {standards.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-mono font-medium">{s.code}</td>
                  <td className="px-3 py-2">{s.version || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{s.title || '—'}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{s.organization}</Badge></td>
                  <td className="px-3 py-2"><button onClick={() => { deleteStandard.mutate(s.id); toast.success('Deleted'); }} className="text-destructive hover:text-destructive/80"><Trash2 className="h-3 w-3" /></button></td>
                </tr>
              ))}
              {standards.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-xs">No standards registered</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OemSpecsTab() {
  const { data: specs = [], isLoading } = useOemSpecifications();
  const createSpec = useCreateOemSpecification();
  const deleteSpec = useDeleteOemSpecification();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ oem_brand: '', spec_code: '', version: '', title: '', region: 'Global' });

  const handleCreate = async () => {
    if (!form.oem_brand.trim() || !form.spec_code.trim()) return;
    await createSpec.mutateAsync({ oem_brand: form.oem_brand, spec_code: form.spec_code, version: form.version || undefined, title: form.title || undefined, region: form.region });
    setForm({ oem_brand: '', spec_code: '', version: '', title: '', region: 'Global' });
    setShowAdd(false);
    toast.success('OEM Specification added');
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
                    {['Global', 'Japan', 'NA', 'EU', 'ASEAN', 'China'].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Title / Description" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.oem_brand.trim() || !form.spec_code.trim()} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">OEM</th><th className="px-3 py-2 text-left">Spec Code</th><th className="px-3 py-2 text-left">Version</th><th className="px-3 py-2 text-left">Title</th><th className="px-3 py-2 text-left">Region</th><th className="px-3 py-2 w-10"></th></tr></thead>
            <tbody>
              {specs.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{s.oem_brand}</td>
                  <td className="px-3 py-2 font-mono">{s.spec_code}</td>
                  <td className="px-3 py-2">{s.version || '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.title || '—'}</td>
                  <td className="px-3 py-2"><Badge variant="secondary" className="text-[10px]">{s.region}</Badge></td>
                  <td className="px-3 py-2"><button onClick={() => { deleteSpec.mutate(s.id); toast.success('Deleted'); }} className="text-destructive hover:text-destructive/80"><Trash2 className="h-3 w-3" /></button></td>
                </tr>
              ))}
              {specs.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground text-xs">No OEM specifications registered</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ConditioningTab() {
  const { data: profiles = [], isLoading } = useConditioningProfiles();
  const createProfile = useCreateConditioningProfile();
  const deleteProfile = useDeleteConditioningProfile();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', temperature_c: '', humidity_percent: '', duration_hours: '', description: '' });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
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
              <Button onClick={handleCreate} disabled={!form.name.trim()} className="w-full">Save</Button>
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
                  <button onClick={() => { deleteProfile.mutate(p.id); toast.success('Deleted'); }} className="text-destructive hover:text-destructive/80"><Trash2 className="h-3 w-3" /></button>
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
    </div>
  );
}
