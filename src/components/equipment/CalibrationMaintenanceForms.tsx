import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CAL_STATUSES, MAINTENANCE_TYPES, TRACEABILITY_OPTIONS } from '@/lib/equipment-constants';

export const blankCalibrationForm = {
  calibration_date: '', next_due_date: '', performed_by: '',
  certificate_number: '', status: 'In Cal', in_tolerance: true,
  uncertainty: '', traceability: '', accreditation_body: '',
  document_url: '', notes: '',
};

export const blankMaintenanceForm = {
  maintenance_date: '', maintenance_type: 'Preventive',
  description: '', parts_replaced: '', performed_by: '',
  cost: '', downtime_hours: '', next_service_date: '',
};

export type CalibrationFormState = typeof blankCalibrationForm;
export type MaintenanceFormState = typeof blankMaintenanceForm;

export function calibrationFormToPayload(equipment_id: string, f: CalibrationFormState) {
  const txt = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    equipment_id,
    calibration_date: f.calibration_date,
    next_due_date: txt(f.next_due_date),
    performed_by: txt(f.performed_by),
    certificate_number: txt(f.certificate_number),
    status: f.status,
    in_tolerance: f.in_tolerance,
    uncertainty: txt(f.uncertainty),
    traceability: txt(f.traceability),
    accreditation_body: txt(f.accreditation_body),
    document_url: txt(f.document_url),
    notes: txt(f.notes),
  };
}

export function maintenanceFormToPayload(equipment_id: string, f: MaintenanceFormState) {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  const txt = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    equipment_id,
    maintenance_date: f.maintenance_date,
    maintenance_type: f.maintenance_type,
    description: txt(f.description),
    parts_replaced: txt(f.parts_replaced),
    performed_by: txt(f.performed_by),
    cost: num(f.cost),
    downtime_hours: num(f.downtime_hours),
    next_service_date: txt(f.next_service_date),
  };
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

type CalProps = { form: CalibrationFormState; setForm: (u: (f: CalibrationFormState) => CalibrationFormState) => void };
export function CalibrationFormFields({ form, setForm }: CalProps) {
  const set = (k: keyof CalibrationFormState) => (v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <L label="Calibration Date *">
          <Input type="date" value={form.calibration_date} onChange={e => set('calibration_date')(e.target.value)} />
        </L>
        <L label="Next Due Date">
          <Input type="date" value={form.next_due_date} onChange={e => set('next_due_date')(e.target.value)} />
        </L>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <L label="Performed By">
          <Input value={form.performed_by} onChange={e => set('performed_by')(e.target.value)} placeholder="Lab / Person" />
        </L>
        <L label="Certificate Number">
          <Input value={form.certificate_number} onChange={e => set('certificate_number')(e.target.value)} />
        </L>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <L label="Status">
          <Select value={form.status} onValueChange={set('status')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </L>
        <div className="flex items-end gap-2 pb-2">
          <Switch checked={form.in_tolerance} onCheckedChange={set('in_tolerance')} id="in-tol" />
          <Label htmlFor="in-tol" className="text-xs">In tolerance</Label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <L label="Traceability">
          <Select value={form.traceability} onValueChange={set('traceability')}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{TRACEABILITY_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </L>
        <L label="Accreditation Body">
          <Input value={form.accreditation_body} onChange={e => set('accreditation_body')(e.target.value)} />
        </L>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <L label="Measurement Uncertainty">
          <Input value={form.uncertainty} onChange={e => set('uncertainty')(e.target.value)} placeholder="±0.3 N" />
        </L>
        <L label="Certificate URL">
          <Input value={form.document_url} onChange={e => set('document_url')(e.target.value)} placeholder="https://…" />
        </L>
      </div>
      <L label="Notes">
        <Textarea rows={2} value={form.notes} onChange={e => set('notes')(e.target.value)} />
      </L>
    </div>
  );
}

type MaintProps = { form: MaintenanceFormState; setForm: (u: (f: MaintenanceFormState) => MaintenanceFormState) => void };
export function MaintenanceFormFields({ form, setForm }: MaintProps) {
  const set = (k: keyof MaintenanceFormState) => (v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <L label="Maintenance Date *">
          <Input type="date" value={form.maintenance_date} onChange={e => set('maintenance_date')(e.target.value)} />
        </L>
        <L label="Type">
          <Select value={form.maintenance_type} onValueChange={set('maintenance_type')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MAINTENANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </L>
      </div>
      <L label="Description">
        <Textarea rows={2} value={form.description} onChange={e => set('description')(e.target.value)} />
      </L>
      <div className="grid grid-cols-2 gap-2">
        <L label="Parts Replaced">
          <Input value={form.parts_replaced} onChange={e => set('parts_replaced')(e.target.value)} />
        </L>
        <L label="Performed By">
          <Input value={form.performed_by} onChange={e => set('performed_by')(e.target.value)} />
        </L>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <L label="Cost">
          <Input type="number" step="0.01" value={form.cost} onChange={e => set('cost')(e.target.value)} />
        </L>
        <L label="Downtime (hrs)">
          <Input type="number" step="0.1" value={form.downtime_hours} onChange={e => set('downtime_hours')(e.target.value)} />
        </L>
        <L label="Next Service">
          <Input type="date" value={form.next_service_date} onChange={e => set('next_service_date')(e.target.value)} />
        </L>
      </div>
    </div>
  );
}
