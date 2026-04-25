import { useState, useEffect } from 'react';
import {
  useEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment,
  useCalibrationRecords, useMaintenanceLogs,
  useAddCalibration, useUpdateCalibration, useDeleteCalibration,
  useAddMaintenanceLog, useUpdateMaintenanceLog, useDeleteMaintenanceLog,
} from '@/hooks/useEquipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Wrench, Shield, Trash2, Pencil, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Testing', 'Measurement', 'Conditioning', 'Safety', 'General'];
const STATUSES = ['Active', 'Out of Service', 'Retired'];
const CAL_STATUSES = ['In Cal', 'Out of Cal', 'Due Soon'];
const MAINT_TYPES = ['Preventive', 'Corrective', 'Emergency'];
const blankEquipForm = { name: '', model: '', serial_number: '', manufacturer: '', category: 'Testing', location: '', assigned_operator: '', status: 'Active', notes: '' };

export default function EquipmentPage() {
  const { data: equipment = [], isLoading } = useEquipment();
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [form, setForm] = useState(blankEquipForm);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createEquipment.mutateAsync(form);
      setForm(blankEquipForm);
      setShowAdd(false);
      toast.success('Equipment added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
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
            <EquipmentFormFields form={form} setForm={setForm as any} />
            <Button onClick={handleCreate} disabled={!form.name.trim() || createEquipment.isPending} className="w-full">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {equipment.map(eq => (
            <Card key={eq.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm cursor-pointer flex-1" onClick={() => setSelectedId(eq.id)}>{eq.name}</CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={eq.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">{eq.status}</Badge>
                    <button onClick={() => setEditing(eq)} className="text-muted-foreground hover:text-foreground p-1" aria-label="Edit"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => setConfirmDelete(eq)} className="text-destructive hover:text-destructive/80 p-1" aria-label="Delete"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="cursor-pointer" onClick={() => setSelectedId(eq.id)}>
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

      <EditEquipmentDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSave={async (id, updates) => {
          try {
            await updateEquipment.mutateAsync({ id, ...updates });
            toast.success('Equipment updated');
            setEditing(null);
          } catch (e: any) { toast.error(e.message || 'Failed to update'); }
        }}
        isPending={updateEquipment.isPending}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete equipment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{confirmDelete?.name}</span> and may affect linked calibration / maintenance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmDelete) return;
              try {
                await deleteEquipment.mutateAsync(confirmDelete.id);
                toast.success('Deleted');
              } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
              setConfirmDelete(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EquipmentFormFields({ form, setForm }: { form: typeof blankEquipForm; setForm: (f: any) => void }) {
  return (
    <div className="space-y-3">
      <Input placeholder="Name *" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Model" value={form.model} onChange={e => setForm((f: any) => ({ ...f, model: e.target.value }))} />
        <Input placeholder="Serial Number" value={form.serial_number} onChange={e => setForm((f: any) => ({ ...f, serial_number: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Manufacturer" value={form.manufacturer} onChange={e => setForm((f: any) => ({ ...f, manufacturer: e.target.value }))} />
        <Select value={form.category} onValueChange={v => setForm((f: any) => ({ ...f, category: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Location" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} />
        <Input placeholder="Assigned Operator" value={form.assigned_operator} onChange={e => setForm((f: any) => ({ ...f, assigned_operator: e.target.value }))} />
      </div>
      <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} />
    </div>
  );
}

function EditEquipmentDialog({ row, onClose, onSave, isPending }: { row: any | null; onClose: () => void; onSave: (id: string, updates: any) => void; isPending: boolean }) {
  const [form, setForm] = useState(blankEquipForm);
  useEffect(() => {
    if (row) {
      setForm({
        name: row.name || '', model: row.model || '', serial_number: row.serial_number || '',
        manufacturer: row.manufacturer || '', category: row.category || 'Testing',
        location: row.location || '', assigned_operator: row.assigned_operator || '',
        status: row.status || 'Active', notes: row.notes || '',
      });
    }
  }, [row]);
  if (!row) return null;
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
        <EquipmentFormFields form={form} setForm={setForm} />
        <Button onClick={() => onSave(row.id, {
          name: form.name, model: form.model || null, serial_number: form.serial_number || null,
          manufacturer: form.manufacturer || null, category: form.category, location: form.location || null,
          assigned_operator: form.assigned_operator || null, status: form.status, notes: form.notes || null,
        })} disabled={!form.name.trim() || isPending} className="w-full">Save Changes</Button>
      </DialogContent>
    </Dialog>
  );
}

// ============ DETAIL ============
const blankCalForm = { calibration_date: '', next_due_date: '', performed_by: '', certificate_number: '', status: 'In Cal', notes: '' };
const blankMaintForm = { maintenance_date: '', maintenance_type: 'Preventive', description: '', parts_replaced: '', performed_by: '' };

function EquipmentDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: equipment } = useEquipment();
  const eq = equipment?.find(e => e.id === id);
  const { data: calibrations = [] } = useCalibrationRecords(id);
  const { data: maintenanceLogs = [] } = useMaintenanceLogs(id);
  const addCalibration = useAddCalibration();
  const updateCalibration = useUpdateCalibration();
  const deleteCalibration = useDeleteCalibration();
  const addMaintenance = useAddMaintenanceLog();
  const updateMaintenance = useUpdateMaintenanceLog();
  const deleteMaintenance = useDeleteMaintenanceLog();
  const [calForm, setCalForm] = useState(blankCalForm);
  const [maintForm, setMaintForm] = useState(blankMaintForm);
  const [showCalDialog, setShowCalDialog] = useState(false);
  const [showMaintDialog, setShowMaintDialog] = useState(false);
  const [editingCal, setEditingCal] = useState<any | null>(null);
  const [editingMaint, setEditingMaint] = useState<any | null>(null);
  const [confirmDeleteCal, setConfirmDeleteCal] = useState<any | null>(null);
  const [confirmDeleteMaint, setConfirmDeleteMaint] = useState<any | null>(null);

  const handleAddCal = async () => {
    if (!calForm.calibration_date) return;
    try {
      await addCalibration.mutateAsync({ equipment_id: id, ...calForm });
      setCalForm(blankCalForm);
      setShowCalDialog(false);
      toast.success('Calibration record added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  const handleAddMaint = async () => {
    if (!maintForm.maintenance_date) return;
    try {
      await addMaintenance.mutateAsync({ equipment_id: id, ...maintForm });
      setMaintForm(blankMaintForm);
      setShowMaintDialog(false);
      toast.success('Maintenance log added');
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
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
                <CalibrationFormFields form={calForm} setForm={setCalForm as any} />
                <Button onClick={handleAddCal} disabled={!calForm.calibration_date || addCalibration.isPending} className="w-full">Save</Button>
              </DialogContent>
            </Dialog>
          </div>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Next Due</th><th className="px-3 py-2 text-left">By</th><th className="px-3 py-2 text-left">Cert #</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 w-20"></th></tr></thead>
              <tbody>
                {calibrations.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.calibration_date}</td>
                    <td className="px-3 py-2">{c.next_due_date || '—'}</td>
                    <td className="px-3 py-2">{c.performed_by || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{c.certificate_number || '—'}</td>
                    <td className="px-3 py-2"><Badge variant={c.status === 'In Cal' ? 'default' : 'destructive'} className="text-[10px]">{c.status}</Badge></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingCal(c)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => setConfirmDeleteCal(c)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {calibrations.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground text-xs">No calibration records</td></tr>}
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
                <MaintenanceFormFields form={maintForm} setForm={setMaintForm as any} />
                <Button onClick={handleAddMaint} disabled={!maintForm.maintenance_date || addMaintenance.isPending} className="w-full">Save</Button>
              </DialogContent>
            </Dialog>
          </div>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-xs"><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-left">By</th><th className="px-3 py-2 w-20"></th></tr></thead>
              <tbody>
                {maintenanceLogs.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">{m.maintenance_date}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{m.maintenance_type}</Badge></td>
                    <td className="px-3 py-2 text-xs">{m.description || '—'}</td>
                    <td className="px-3 py-2">{m.performed_by || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingMaint(m)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => setConfirmDeleteMaint(m)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {maintenanceLogs.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-xs">No maintenance logs</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <EditCalibrationDialog
        row={editingCal}
        equipmentId={id}
        onClose={() => setEditingCal(null)}
        onSave={async (recId, updates) => {
          try {
            await updateCalibration.mutateAsync({ id: recId, equipment_id: id, ...updates });
            toast.success('Calibration updated');
            setEditingCal(null);
          } catch (e: any) { toast.error(e.message || 'Failed to update'); }
        }}
        isPending={updateCalibration.isPending}
      />

      <EditMaintenanceDialog
        row={editingMaint}
        equipmentId={id}
        onClose={() => setEditingMaint(null)}
        onSave={async (recId, updates) => {
          try {
            await updateMaintenance.mutateAsync({ id: recId, equipment_id: id, ...updates });
            toast.success('Maintenance log updated');
            setEditingMaint(null);
          } catch (e: any) { toast.error(e.message || 'Failed to update'); }
        }}
        isPending={updateMaintenance.isPending}
      />

      <AlertDialog open={!!confirmDeleteCal} onOpenChange={(o) => !o && setConfirmDeleteCal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete calibration record?</AlertDialogTitle>
            <AlertDialogDescription>Record from {confirmDeleteCal?.calibration_date} will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmDeleteCal) return;
              try {
                await deleteCalibration.mutateAsync({ id: confirmDeleteCal.id, equipment_id: id });
                toast.success('Deleted');
              } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
              setConfirmDeleteCal(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDeleteMaint} onOpenChange={(o) => !o && setConfirmDeleteMaint(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete maintenance log?</AlertDialogTitle>
            <AlertDialogDescription>Log from {confirmDeleteMaint?.maintenance_date} will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmDeleteMaint) return;
              try {
                await deleteMaintenance.mutateAsync({ id: confirmDeleteMaint.id, equipment_id: id });
                toast.success('Deleted');
              } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
              setConfirmDeleteMaint(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CalibrationFormFields({ form, setForm }: { form: typeof blankCalForm; setForm: (f: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground">Cal. Date *</label><Input type="date" value={form.calibration_date} onChange={e => setForm((f: any) => ({ ...f, calibration_date: e.target.value }))} /></div>
        <div><label className="text-xs text-muted-foreground">Next Due</label><Input type="date" value={form.next_due_date} onChange={e => setForm((f: any) => ({ ...f, next_due_date: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Performed By" value={form.performed_by} onChange={e => setForm((f: any) => ({ ...f, performed_by: e.target.value }))} />
        <Input placeholder="Certificate No." value={form.certificate_number} onChange={e => setForm((f: any) => ({ ...f, certificate_number: e.target.value }))} />
      </div>
      <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{CAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} />
    </div>
  );
}

function EditCalibrationDialog({ row, equipmentId, onClose, onSave, isPending }: { row: any | null; equipmentId: string; onClose: () => void; onSave: (id: string, updates: any) => void; isPending: boolean }) {
  const [form, setForm] = useState(blankCalForm);
  useEffect(() => {
    if (row) setForm({
      calibration_date: row.calibration_date || '', next_due_date: row.next_due_date || '',
      performed_by: row.performed_by || '', certificate_number: row.certificate_number || '',
      status: row.status || 'In Cal', notes: row.notes || '',
    });
  }, [row]);
  if (!row) return null;
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Calibration Record</DialogTitle></DialogHeader>
        <CalibrationFormFields form={form} setForm={setForm} />
        <Button onClick={() => onSave(row.id, {
          calibration_date: form.calibration_date,
          next_due_date: form.next_due_date || null,
          performed_by: form.performed_by || null,
          certificate_number: form.certificate_number || null,
          status: form.status,
          notes: form.notes || null,
        })} disabled={!form.calibration_date || isPending} className="w-full">Save Changes</Button>
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceFormFields({ form, setForm }: { form: typeof blankMaintForm; setForm: (f: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground">Date *</label><Input type="date" value={form.maintenance_date} onChange={e => setForm((f: any) => ({ ...f, maintenance_date: e.target.value }))} /></div>
        <Select value={form.maintenance_type} onValueChange={v => setForm((f: any) => ({ ...f, maintenance_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{MAINT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Textarea placeholder="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Parts Replaced" value={form.parts_replaced} onChange={e => setForm((f: any) => ({ ...f, parts_replaced: e.target.value }))} />
        <Input placeholder="Performed By" value={form.performed_by} onChange={e => setForm((f: any) => ({ ...f, performed_by: e.target.value }))} />
      </div>
    </div>
  );
}

function EditMaintenanceDialog({ row, equipmentId, onClose, onSave, isPending }: { row: any | null; equipmentId: string; onClose: () => void; onSave: (id: string, updates: any) => void; isPending: boolean }) {
  const [form, setForm] = useState(blankMaintForm);
  useEffect(() => {
    if (row) setForm({
      maintenance_date: row.maintenance_date || '',
      maintenance_type: row.maintenance_type || 'Preventive',
      description: row.description || '',
      parts_replaced: row.parts_replaced || '',
      performed_by: row.performed_by || '',
    });
  }, [row]);
  if (!row) return null;
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Maintenance Log</DialogTitle></DialogHeader>
        <MaintenanceFormFields form={form} setForm={setForm} />
        <Button onClick={() => onSave(row.id, {
          maintenance_date: form.maintenance_date,
          maintenance_type: form.maintenance_type,
          description: form.description || null,
          parts_replaced: form.parts_replaced || null,
          performed_by: form.performed_by || null,
        })} disabled={!form.maintenance_date || isPending} className="w-full">Save Changes</Button>
      </DialogContent>
    </Dialog>
  );
}
