import { useState } from 'react';
import { useEquipment, useCreateEquipment, useDeleteEquipment, useCalibrationRecords, useMaintenanceLogs, useAddCalibration, useAddMaintenanceLog } from '@/hooks/useEquipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Wrench, Shield, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EquipmentPage() {
  const { data: equipment = [], isLoading } = useEquipment();
  const createEquipment = useCreateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', model: '', serial_number: '', manufacturer: '', category: 'Testing', location: '', assigned_operator: '' });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createEquipment.mutateAsync(form);
    setForm({ name: '', model: '', serial_number: '', manufacturer: '', category: 'Testing', location: '', assigned_operator: '' });
    setShowAdd(false);
    toast.success('Equipment added');
  };

  if (selectedId) {
    return <EquipmentDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment Registry</h1>
          <p className="text-sm text-muted-foreground">Manage lab equipment, calibration, and maintenance</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Equipment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Model" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
                <Input placeholder="Serial Number" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Manufacturer" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Testing', 'Measurement', 'Conditioning', 'Safety', 'General'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                <Input placeholder="Assigned Operator" value={form.assigned_operator} onChange={e => setForm(f => ({ ...f, assigned_operator: e.target.value }))} />
              </div>
              <Button onClick={handleCreate} disabled={!form.name.trim()} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {equipment.map(eq => (
            <Card key={eq.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedId(eq.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{eq.name}</CardTitle>
                  <Badge variant={eq.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">{eq.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {eq.model && <p>Model: {eq.model}</p>}
                  {eq.serial_number && <p>S/N: {eq.serial_number}</p>}
                  {eq.location && <p>📍 {eq.location}</p>}
                  <p className="text-[10px]">{eq.category}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {equipment.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No equipment registered yet.</p>}
        </div>
      )}
    </div>
  );
}

function EquipmentDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: equipment } = useEquipment();
  const eq = equipment?.find(e => e.id === id);
  const { data: calibrations = [] } = useCalibrationRecords(id);
  const { data: maintenanceLogs = [] } = useMaintenanceLogs(id);
  const addCalibration = useAddCalibration();
  const addMaintenance = useAddMaintenanceLog();
  const [calForm, setCalForm] = useState({ calibration_date: '', next_due_date: '', performed_by: '', certificate_number: '', status: 'In Cal', notes: '' });
  const [maintForm, setMaintForm] = useState({ maintenance_date: '', maintenance_type: 'Preventive', description: '', parts_replaced: '', performed_by: '' });
  const [showCalDialog, setShowCalDialog] = useState(false);
  const [showMaintDialog, setShowMaintDialog] = useState(false);

  const handleAddCal = async () => {
    if (!calForm.calibration_date) return;
    await addCalibration.mutateAsync({ equipment_id: id, ...calForm });
    setCalForm({ calibration_date: '', next_due_date: '', performed_by: '', certificate_number: '', status: 'In Cal', notes: '' });
    setShowCalDialog(false);
    toast.success('Calibration record added');
  };

  const handleAddMaint = async () => {
    if (!maintForm.maintenance_date) return;
    await addMaintenance.mutateAsync({ equipment_id: id, ...maintForm });
    setMaintForm({ maintenance_date: '', maintenance_type: 'Preventive', description: '', parts_replaced: '', performed_by: '' });
    setShowMaintDialog(false);
    toast.success('Maintenance log added');
  };

  if (!eq) return null;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <div>
        <h2 className="text-xl font-bold">{eq.name}</h2>
        <p className="text-sm text-muted-foreground">{eq.model} — {eq.serial_number || 'No S/N'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {[
          ['Manufacturer', eq.manufacturer],
          ['Category', eq.category],
          ['Location', eq.location],
          ['Operator', eq.assigned_operator],
        ].map(([label, val]) => (
          <Card key={label as string} className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
            <p className="font-medium">{val || '—'}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="calibration">
        <TabsList>
          <TabsTrigger value="calibration"><Shield className="h-3 w-3 mr-1" /> Calibration</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-3 w-3 mr-1" /> Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="calibration" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={showCalDialog} onOpenChange={setShowCalDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Calibration</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Calibration Record</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-muted-foreground">Cal. Date *</label><Input type="date" value={calForm.calibration_date} onChange={e => setCalForm(f => ({ ...f, calibration_date: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground">Next Due</label><Input type="date" value={calForm.next_due_date} onChange={e => setCalForm(f => ({ ...f, next_due_date: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Performed By" value={calForm.performed_by} onChange={e => setCalForm(f => ({ ...f, performed_by: e.target.value }))} />
                    <Input placeholder="Certificate No." value={calForm.certificate_number} onChange={e => setCalForm(f => ({ ...f, certificate_number: e.target.value }))} />
                  </div>
                  <Select value={calForm.status} onValueChange={v => setCalForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Cal">In Cal</SelectItem>
                      <SelectItem value="Out of Cal">Out of Cal</SelectItem>
                      <SelectItem value="Due Soon">Due Soon</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Notes" value={calForm.notes} onChange={e => setCalForm(f => ({ ...f, notes: e.target.value }))} />
                  <Button onClick={handleAddCal} disabled={!calForm.calibration_date} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Next Due</th><th className="px-3 py-2 text-left">By</th><th className="px-3 py-2 text-left">Cert #</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
              <tbody>
                {calibrations.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.calibration_date}</td>
                    <td className="px-3 py-2">{c.next_due_date || '—'}</td>
                    <td className="px-3 py-2">{c.performed_by || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{c.certificate_number || '—'}</td>
                    <td className="px-3 py-2"><Badge variant={c.status === 'In Cal' ? 'default' : 'destructive'} className="text-[10px]">{c.status}</Badge></td>
                  </tr>
                ))}
                {calibrations.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-xs">No calibration records</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={showMaintDialog} onOpenChange={setShowMaintDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Log</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Maintenance Log</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-muted-foreground">Date *</label><Input type="date" value={maintForm.maintenance_date} onChange={e => setMaintForm(f => ({ ...f, maintenance_date: e.target.value }))} /></div>
                    <Select value={maintForm.maintenance_type} onValueChange={v => setMaintForm(f => ({ ...f, maintenance_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Preventive">Preventive</SelectItem>
                        <SelectItem value="Corrective">Corrective</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea placeholder="Description" value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Parts Replaced" value={maintForm.parts_replaced} onChange={e => setMaintForm(f => ({ ...f, parts_replaced: e.target.value }))} />
                    <Input placeholder="Performed By" value={maintForm.performed_by} onChange={e => setMaintForm(f => ({ ...f, performed_by: e.target.value }))} />
                  </div>
                  <Button onClick={handleAddMaint} disabled={!maintForm.maintenance_date} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-left">By</th></tr></thead>
              <tbody>
                {maintenanceLogs.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">{m.maintenance_date}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{m.maintenance_type}</Badge></td>
                    <td className="px-3 py-2 text-xs">{m.description || '—'}</td>
                    <td className="px-3 py-2">{m.performed_by || '—'}</td>
                  </tr>
                ))}
                {maintenanceLogs.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground text-xs">No maintenance logs</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
