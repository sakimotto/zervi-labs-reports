import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  useEquipmentDetail, useUpdateEquipment, useDeleteEquipment,
  useCalibrationRecords, useMaintenanceLogs,
  useAddCalibration, useUpdateCalibration, useDeleteCalibration,
  useAddMaintenanceLog, useUpdateMaintenanceLog, useDeleteMaintenanceLog,
  useEquipmentLinkedMethods,
} from '@/hooks/useEquipment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Pencil, Trash2, Plus, Wrench, Shield, FileText, History, Settings2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  EquipmentFormFields, blankEquipmentForm, equipmentFormToPayload,
  rowToEquipmentForm, validateEquipmentForm, type EquipmentFormState,
} from '@/components/equipment/EquipmentFormFields';
import {
  CalibrationFormFields, MaintenanceFormFields,
  blankCalibrationForm, blankMaintenanceForm,
  calibrationFormToPayload, maintenanceFormToPayload,
  type CalibrationFormState, type MaintenanceFormState,
} from '@/components/equipment/CalibrationMaintenanceForms';
import { EquipmentAuditPanel } from '@/components/equipment/EquipmentAuditPanel';
import { deriveCalStatus } from '@/lib/equipment-constants';
import { format } from 'date-fns';

function StatBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const variant = status === 'Active' ? 'default' : status === 'Retired' ? 'secondary' : 'destructive';
  return <Badge variant={variant as any} className="text-[10px]">{status}</Badge>;
}

function CalBadge({ next_due }: { next_due?: string | null }) {
  const status = deriveCalStatus(next_due);
  if (!status) return <Badge variant="outline" className="text-[10px]">Cal: Unknown</Badge>;
  const tone = status === 'In Cal' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
    : status === 'Due Soon' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
    : 'bg-destructive/15 text-destructive border-destructive/30';
  return <Badge variant="outline" className={`text-[10px] ${tone}`}>Cal: {status}</Badge>;
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: eq, isLoading } = useEquipmentDetail(id || null);
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const { data: calibrations = [] } = useCalibrationRecords(id || null);
  const { data: maintenance = [] } = useMaintenanceLogs(id || null);
  const { data: linkedMethods = [] } = useEquipmentLinkedMethods(id || null);
  const addCal = useAddCalibration();
  const updateCal = useUpdateCalibration();
  const deleteCal = useDeleteCalibration();
  const addMaint = useAddMaintenanceLog();
  const updateMaint = useUpdateMaintenanceLog();
  const deleteMaint = useDeleteMaintenanceLog();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EquipmentFormState>(blankEquipmentForm);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [calDialog, setCalDialog] = useState(false);
  const [calForm, setCalForm] = useState<CalibrationFormState>(blankCalibrationForm);
  const [editCal, setEditCal] = useState<any | null>(null);
  const [confirmDelCal, setConfirmDelCal] = useState<any | null>(null);

  const [maintDialog, setMaintDialog] = useState(false);
  const [maintForm, setMaintForm] = useState<MaintenanceFormState>(blankMaintenanceForm);
  const [editMaint, setEditMaint] = useState<any | null>(null);
  const [confirmDelMaint, setConfirmDelMaint] = useState<any | null>(null);

  const totalDowntime = useMemo(
    () => maintenance.reduce((s, m) => s + (Number(m.downtime_hours) || 0), 0),
    [maintenance]
  );
  const totalMaintCost = useMemo(
    () => maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0),
    [maintenance]
  );

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!eq) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/equipment')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <p className="text-sm text-muted-foreground">Equipment not found.</p>
      </div>
    );
  }

  const openEdit = () => {
    setEditForm(rowToEquipmentForm(eq));
    setEditErrors({});
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    const errs = validateEquipmentForm(editForm);
    setEditErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await updateEquipment.mutateAsync({ id: eq.id, ...equipmentFormToPayload(editForm) } as any);
      toast.success('Equipment updated');
      setEditOpen(false);
    } catch (e: any) { toast.error(e.message || 'Failed to update'); }
  };

  const handleDelete = async () => {
    try {
      await deleteEquipment.mutateAsync(eq.id);
      toast.success('Deleted');
      navigate('/equipment');
    } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
  };

  const handleAddCal = async () => {
    if (!calForm.calibration_date) { toast.error('Calibration date required'); return; }
    try {
      await addCal.mutateAsync(calibrationFormToPayload(eq.id, calForm) as any);
      setCalForm(blankCalibrationForm);
      setCalDialog(false);
      toast.success('Calibration added');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  const handleAddMaint = async () => {
    if (!maintForm.maintenance_date) { toast.error('Maintenance date required'); return; }
    try {
      await addMaint.mutateAsync(maintenanceFormToPayload(eq.id, maintForm) as any);
      setMaintForm(blankMaintenanceForm);
      setMaintDialog(false);
      toast.success('Maintenance log added');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/equipment')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{eq.name}</h1>
              <StatBadge status={eq.status} />
              <CalBadge next_due={eq.next_calibration_due} />
            </div>
            <p className="text-sm text-muted-foreground">
              {eq.category}{eq.sub_type ? ` · ${eq.sub_type}` : ''} · {eq.manufacturer || '—'} {eq.model || ''}
              {eq.asset_tag && <span className="ml-2 font-mono text-xs">[{eq.asset_tag}]</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={openEdit}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
          <Button size="sm" variant="outline" onClick={() => setConfirmDelete(true)} className="text-destructive">
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Last Cal</p><p className="font-medium">{eq.last_calibration_date || '—'}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Next Cal Due</p><p className="font-medium">{eq.next_calibration_due || '—'}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Downtime (h)</p><p className="font-medium">{totalDowntime.toFixed(1)}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Maint. Spend</p><p className="font-medium">{eq.currency || ''} {totalMaintCost.toFixed(2)}</p></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><FileText className="h-3 w-3 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="specs"><Settings2 className="h-3 w-3 mr-1" /> Specs</TabsTrigger>
          <TabsTrigger value="calibration"><Shield className="h-3 w-3 mr-1" /> Calibration</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-3 w-3 mr-1" /> Maintenance</TabsTrigger>
          <TabsTrigger value="methods">Linked Methods</TabsTrigger>
          <TabsTrigger value="audit"><History className="h-3 w-3 mr-1" /> Audit</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Identity</CardTitle></CardHeader>
              <CardContent className="text-xs grid grid-cols-2 gap-y-1.5">
                <Row k="Asset Tag" v={eq.asset_tag} mono />
                <Row k="Serial #" v={eq.serial_number} mono />
                <Row k="Vendor" v={eq.vendor} />
                <Row k="Purchase Date" v={eq.purchase_date} />
                <Row k="Purchase Cost" v={eq.purchase_cost ? `${eq.currency || ''} ${eq.purchase_cost}` : null} />
                <Row k="Warranty Until" v={eq.warranty_until} />
                <Row k="Condition" v={eq.condition_rating ? `${eq.condition_rating}/5` : null} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Location</CardTitle></CardHeader>
              <CardContent className="text-xs grid grid-cols-2 gap-y-1.5">
                <Row k="Lab" v={eq.location} />
                <Row k="Room" v={eq.room} />
                <Row k="Bench" v={eq.bench} />
                <Row k="Operator" v={eq.assigned_operator} />
              </CardContent>
            </Card>
          </div>
          {eq.notes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent className="text-xs whitespace-pre-wrap">{eq.notes}</CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SPECS */}
        <TabsContent value="specs" className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Measurement</CardTitle></CardHeader>
              <CardContent className="text-xs grid grid-cols-2 gap-y-1.5">
                <Row k="Range" v={eq.measurement_min != null || eq.measurement_max != null
                  ? `${eq.measurement_min ?? '—'} – ${eq.measurement_max ?? '—'} ${eq.measurement_unit || ''}` : null} />
                <Row k="Unit" v={eq.measurement_unit} />
                <Row k="Accuracy" v={eq.accuracy} />
                <Row k="Resolution" v={eq.resolution} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Operating Environment</CardTitle></CardHeader>
              <CardContent className="text-xs grid grid-cols-2 gap-y-1.5">
                <Row k="Temp Range" v={eq.operating_temp_min != null || eq.operating_temp_max != null
                  ? `${eq.operating_temp_min ?? '—'} – ${eq.operating_temp_max ?? '—'} °C` : null} />
                <Row k="Humidity Range" v={eq.operating_humidity_min != null || eq.operating_humidity_max != null
                  ? `${eq.operating_humidity_min ?? '—'} – ${eq.operating_humidity_max ?? '—'} %` : null} />
                <Row k="Power" v={eq.power_requirements} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Software / Firmware</CardTitle></CardHeader>
              <CardContent className="text-xs grid grid-cols-2 gap-y-1.5">
                <Row k="Firmware" v={eq.firmware_version} />
                <Row k="Software" v={eq.software_version} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Accessories</CardTitle></CardHeader>
              <CardContent className="text-xs whitespace-pre-wrap">{eq.accessories || '—'}</CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Calibration Program</CardTitle></CardHeader>
              <CardContent className="text-xs grid grid-cols-3 gap-y-1.5">
                <Row k="Interval" v={eq.calibration_interval_days ? `${eq.calibration_interval_days} days` : null} />
                <Row k="Traceability" v={eq.calibration_traceability} />
                <Row k="Accreditation" v={eq.accreditation_body} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CALIBRATION */}
        <TabsContent value="calibration" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={calDialog} onOpenChange={setCalDialog}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Calibration</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Add Calibration Record</DialogTitle></DialogHeader>
                <CalibrationFormFields form={calForm} setForm={setCalForm} />
                <Button onClick={handleAddCal} disabled={!calForm.calibration_date || addCal.isPending} className="w-full">Save</Button>
              </DialogContent>
            </Dialog>
          </div>
          <CalibrationTable
            rows={calibrations}
            onEdit={setEditCal}
            onDelete={setConfirmDelCal}
          />
        </TabsContent>

        {/* MAINTENANCE */}
        <TabsContent value="maintenance" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={maintDialog} onOpenChange={setMaintDialog}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Log</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Add Maintenance Log</DialogTitle></DialogHeader>
                <MaintenanceFormFields form={maintForm} setForm={setMaintForm} />
                <Button onClick={handleAddMaint} disabled={!maintForm.maintenance_date || addMaint.isPending} className="w-full">Save</Button>
              </DialogContent>
            </Dialog>
          </div>
          <MaintenanceTable
            rows={maintenance}
            onEdit={setEditMaint}
            onDelete={setConfirmDelMaint}
          />
        </TabsContent>

        {/* METHODS */}
        <TabsContent value="methods" className="space-y-3">
          {linkedMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No test methods reference this equipment yet.</p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 text-xs text-left">
                  <th className="px-3 py-2">Method</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Mandatory</th><th className="px-3 py-2">Cal Required</th><th className="px-3 py-2"></th>
                </tr></thead>
                <tbody>
                  {linkedMethods.map((l: any) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-3 py-2">{l.test_item?.name || '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{l.test_item?.method_code || '—'}</td>
                      <td className="px-3 py-2">{l.test_item?.category || '—'}</td>
                      <td className="px-3 py-2">{l.is_mandatory ? <Badge variant="default" className="text-[10px]">Yes</Badge> : <Badge variant="outline" className="text-[10px]">No</Badge>}</td>
                      <td className="px-3 py-2">{l.calibration_required ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 text-right">
                        {l.test_item_id && (
                          <Link to={`/test-methods/${l.test_item_id}`} className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                            Open <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* AUDIT */}
        <TabsContent value="audit"><EquipmentAuditPanel equipmentId={eq.id} /></TabsContent>
      </Tabs>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
          <EquipmentFormFields form={editForm} setForm={setEditForm} errors={editErrors} />
          <Button onClick={handleSaveEdit} disabled={updateEquipment.isPending} className="w-full">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete equipment?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <span className="font-medium">{eq.name}</span> and may affect calibration / maintenance / linked method records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EDIT CAL */}
      <EditCalibrationDialog row={editCal} onClose={() => setEditCal(null)}
        onSave={async (id, updates) => {
          try {
            await updateCal.mutateAsync({ id, equipment_id: eq.id, ...updates });
            toast.success('Updated'); setEditCal(null);
          } catch (e: any) { toast.error(e.message || 'Failed'); }
        }} isPending={updateCal.isPending} />

      <AlertDialog open={!!confirmDelCal} onOpenChange={o => !o && setConfirmDelCal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete calibration record?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmDelCal) return;
              try { await deleteCal.mutateAsync({ id: confirmDelCal.id, equipment_id: eq.id }); toast.success('Deleted'); }
              catch (e: any) { toast.error(e.message || 'Failed'); }
              setConfirmDelCal(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EDIT MAINT */}
      <EditMaintenanceDialog row={editMaint} onClose={() => setEditMaint(null)}
        onSave={async (id, updates) => {
          try {
            await updateMaint.mutateAsync({ id, equipment_id: eq.id, ...updates });
            toast.success('Updated'); setEditMaint(null);
          } catch (e: any) { toast.error(e.message || 'Failed'); }
        }} isPending={updateMaint.isPending} />

      <AlertDialog open={!!confirmDelMaint} onOpenChange={o => !o && setConfirmDelMaint(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete maintenance log?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmDelMaint) return;
              try { await deleteMaint.mutateAsync({ id: confirmDelMaint.id, equipment_id: eq.id }); toast.success('Deleted'); }
              catch (e: any) { toast.error(e.message || 'Failed'); }
              setConfirmDelMaint(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: any; mono?: boolean }) {
  return (
    <>
      <span className="text-muted-foreground">{k}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{v == null || v === '' ? '—' : String(v)}</span>
    </>
  );
}

function CalibrationTable({ rows, onEdit, onDelete }: { rows: any[]; onEdit: (r: any) => void; onDelete: (r: any) => void }) {
  if (!rows.length) return <p className="text-xs text-muted-foreground text-center py-6">No calibration records yet.</p>;
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-muted/50 text-xs text-left">
          <th className="px-3 py-2">Date</th><th className="px-3 py-2">Next Due</th><th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">In Tol</th><th className="px-3 py-2">By</th><th className="px-3 py-2">Cert #</th>
          <th className="px-3 py-2">Traceability</th><th className="px-3 py-2"></th>
        </tr></thead>
        <tbody>
          {rows.map(c => (
            <tr key={c.id} className="border-t">
              <td className="px-3 py-2">{c.calibration_date}</td>
              <td className="px-3 py-2">{c.next_due_date || '—'}</td>
              <td className="px-3 py-2"><Badge variant={c.status === 'In Cal' ? 'default' : 'destructive'} className="text-[10px]">{c.status}</Badge></td>
              <td className="px-3 py-2">{c.in_tolerance == null ? '—' : c.in_tolerance ? '✓' : '✗'}</td>
              <td className="px-3 py-2">{c.performed_by || '—'}</td>
              <td className="px-3 py-2 font-mono text-xs">{c.certificate_number || '—'}</td>
              <td className="px-3 py-2 text-xs">{c.traceability || '—'}</td>
              <td className="px-3 py-2">
                <div className="flex gap-1 justify-end">
                  {c.document_url && <a href={c.document_url} target="_blank" rel="noreferrer" className="text-primary p-1"><ExternalLink className="h-3 w-3" /></a>}
                  <button onClick={() => onEdit(c)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => onDelete(c)} className="text-destructive p-1"><Trash2 className="h-3 w-3" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MaintenanceTable({ rows, onEdit, onDelete }: { rows: any[]; onEdit: (r: any) => void; onDelete: (r: any) => void }) {
  if (!rows.length) return <p className="text-xs text-muted-foreground text-center py-6">No maintenance logs yet.</p>;
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-muted/50 text-xs text-left">
          <th className="px-3 py-2">Date</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Description</th>
          <th className="px-3 py-2">Parts</th><th className="px-3 py-2">By</th>
          <th className="px-3 py-2">Cost</th><th className="px-3 py-2">Downtime</th><th className="px-3 py-2">Next Service</th><th className="px-3 py-2"></th>
        </tr></thead>
        <tbody>
          {rows.map(m => (
            <tr key={m.id} className="border-t">
              <td className="px-3 py-2">{m.maintenance_date}</td>
              <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{m.maintenance_type}</Badge></td>
              <td className="px-3 py-2 text-xs max-w-[240px] truncate" title={m.description || ''}>{m.description || '—'}</td>
              <td className="px-3 py-2 text-xs">{m.parts_replaced || '—'}</td>
              <td className="px-3 py-2">{m.performed_by || '—'}</td>
              <td className="px-3 py-2">{m.cost ?? '—'}</td>
              <td className="px-3 py-2">{m.downtime_hours ?? '—'}</td>
              <td className="px-3 py-2">{m.next_service_date || '—'}</td>
              <td className="px-3 py-2">
                <div className="flex gap-1 justify-end">
                  <button onClick={() => onEdit(m)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => onDelete(m)} className="text-destructive p-1"><Trash2 className="h-3 w-3" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditCalibrationDialog({ row, onClose, onSave, isPending }: { row: any | null; onClose: () => void; onSave: (id: string, updates: any) => void; isPending: boolean }) {
  const [form, setForm] = useState<CalibrationFormState>(blankCalibrationForm);
  useMemo(() => {
    if (row) {
      setForm({
        calibration_date: row.calibration_date || '', next_due_date: row.next_due_date || '',
        performed_by: row.performed_by || '', certificate_number: row.certificate_number || '',
        status: row.status || 'In Cal', in_tolerance: row.in_tolerance ?? true,
        uncertainty: row.uncertainty || '', traceability: row.traceability || '',
        accreditation_body: row.accreditation_body || '', document_url: row.document_url || '',
        notes: row.notes || '',
      });
    }
  }, [row]);
  if (!row) return null;
  return (
    <Dialog open={!!row} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Calibration Record</DialogTitle></DialogHeader>
        <CalibrationFormFields form={form} setForm={setForm} />
        <Button onClick={() => onSave(row.id, calibrationFormToPayload(row.equipment_id, form))} disabled={isPending} className="w-full">Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function EditMaintenanceDialog({ row, onClose, onSave, isPending }: { row: any | null; onClose: () => void; onSave: (id: string, updates: any) => void; isPending: boolean }) {
  const [form, setForm] = useState<MaintenanceFormState>(blankMaintenanceForm);
  useMemo(() => {
    if (row) {
      setForm({
        maintenance_date: row.maintenance_date || '', maintenance_type: row.maintenance_type || 'Preventive',
        description: row.description || '', parts_replaced: row.parts_replaced || '',
        performed_by: row.performed_by || '', cost: row.cost?.toString() || '',
        downtime_hours: row.downtime_hours?.toString() || '', next_service_date: row.next_service_date || '',
      });
    }
  }, [row]);
  if (!row) return null;
  return (
    <Dialog open={!!row} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Maintenance Log</DialogTitle></DialogHeader>
        <MaintenanceFormFields form={form} setForm={setForm} />
        <Button onClick={() => onSave(row.id, maintenanceFormToPayload(row.equipment_id, form))} disabled={isPending} className="w-full">Save</Button>
      </DialogContent>
    </Dialog>
  );
}
