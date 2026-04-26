import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useEquipment, useCreateEquipment,
} from '@/hooks/useEquipment';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  EquipmentFormFields, blankEquipmentForm, equipmentFormToPayload,
  validateEquipmentForm, type EquipmentFormState,
} from '@/components/equipment/EquipmentFormFields';
import {
  EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES, CAL_STATUSES, deriveCalStatus,
} from '@/lib/equipment-constants';

export default function EquipmentPage() {
  const navigate = useNavigate();
  const { data: equipment = [], isLoading } = useEquipment();
  const createEquipment = useCreateEquipment();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<EquipmentFormState>(blankEquipmentForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // filters
  const [q, setQ] = useState('');
  const [fCategory, setFCategory] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fCalStatus, setFCalStatus] = useState('all');
  const [fLocation, setFLocation] = useState('all');

  const locations = useMemo(
    () => Array.from(new Set(equipment.map(e => e.location).filter(Boolean))) as string[],
    [equipment]
  );

  const filtered = useMemo(() => {
    return equipment.filter(e => {
      if (fCategory !== 'all' && e.category !== fCategory) return false;
      if (fStatus !== 'all' && e.status !== fStatus) return false;
      if (fLocation !== 'all' && e.location !== fLocation) return false;
      if (fCalStatus !== 'all') {
        const s = deriveCalStatus(e.next_calibration_due);
        if (s !== fCalStatus) return false;
      }
      if (q.trim()) {
        const t = q.toLowerCase();
        const hay = [e.name, e.asset_tag, e.model, e.serial_number, e.manufacturer, e.sub_type, e.location]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [equipment, q, fCategory, fStatus, fCalStatus, fLocation]);

  const dueCount = useMemo(
    () => equipment.filter(e => {
      const s = deriveCalStatus(e.next_calibration_due);
      return s === 'Due Soon' || s === 'Out of Cal';
    }).length, [equipment]
  );

  const handleCreate = async () => {
    const errs = validateEquipmentForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const payload = equipmentFormToPayload(form);
      const created = await createEquipment.mutateAsync(payload as any);
      toast.success('Equipment added');
      setForm(blankEquipmentForm);
      setShowAdd(false);
      if (created?.id) navigate(`/equipment/${created.id}`);
    } catch (e: any) { toast.error(e.message || 'Failed to add'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Equipment Registry</h1>
          <p className="text-sm text-muted-foreground">Manage lab equipment, calibration program, and maintenance</p>
        </div>
        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" /> {dueCount} calibration{dueCount > 1 ? 's' : ''} due / overdue
            </Badge>
          )}
          <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) { setForm(blankEquipmentForm); setErrors({}); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Equipment</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
              <EquipmentFormFields form={form} setForm={setForm} errors={errors} />
              <Button onClick={handleCreate} disabled={createEquipment.isPending} className="w-full">Save</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* FILTERS */}
      <Card className="p-3">
        <div className="grid gap-2 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-7 h-9" placeholder="Search name, tag, model, S/N…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Select value={fCategory} onValueChange={setFCategory}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EQUIPMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {EQUIPMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fCalStatus} onValueChange={setFCalStatus}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Cal status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cal statuses</SelectItem>
              {CAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {locations.length > 0 && (
            <Select value={fLocation} onValueChange={setFLocation}>
              <SelectTrigger className="h-9 md:col-span-1"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* LIST */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No equipment matches.</p>
      ) : (
        <div className="border rounded-md overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-xs text-left">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Asset Tag</th>
              <th className="px-3 py-2">Category / Sub-type</th>
              <th className="px-3 py-2">Manufacturer</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Calibration</th>
              <th className="px-3 py-2">Next Due</th>
            </tr></thead>
            <tbody>
              {filtered.map(eq => {
                const calStatus = deriveCalStatus(eq.next_calibration_due);
                const calTone = calStatus === 'In Cal' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                  : calStatus === 'Due Soon' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                  : calStatus === 'Out of Cal' ? 'bg-destructive/15 text-destructive border-destructive/30'
                  : '';
                return (
                  <tr key={eq.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/equipment/${eq.id}`)}>
                    <td className="px-3 py-2 font-medium">{eq.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{eq.asset_tag || '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      <div>{eq.category}</div>
                      {eq.sub_type && <div className="text-muted-foreground">{eq.sub_type}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div>{eq.manufacturer || '—'}</div>
                      {eq.model && <div className="text-muted-foreground">{eq.model}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {eq.location || '—'}{eq.room ? ` · ${eq.room}` : ''}{eq.bench ? ` · ${eq.bench}` : ''}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={eq.status === 'Active' ? 'default' : eq.status === 'Retired' ? 'secondary' : 'destructive'} className="text-[10px]">{eq.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {calStatus
                        ? <Badge variant="outline" className={`text-[10px] ${calTone}`}>{calStatus}</Badge>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-xs">{eq.next_calibration_due || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
