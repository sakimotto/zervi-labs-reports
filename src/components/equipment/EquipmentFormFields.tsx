import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  EQUIPMENT_CATEGORIES, EQUIPMENT_SUBTYPES, EQUIPMENT_STATUSES, TRACEABILITY_OPTIONS,
} from '@/lib/equipment-constants';

export type EquipmentFormState = {
  name: string;
  asset_tag: string;
  category: string;
  sub_type: string;
  status: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  vendor: string;
  purchase_date: string;
  purchase_cost: string;
  currency: string;
  warranty_until: string;
  // Location
  location: string;
  room: string;
  bench: string;
  assigned_operator: string;
  condition_rating: string;
  photo_url: string;
  // Technical
  measurement_min: string;
  measurement_max: string;
  measurement_unit: string;
  accuracy: string;
  resolution: string;
  operating_temp_min: string;
  operating_temp_max: string;
  operating_humidity_min: string;
  operating_humidity_max: string;
  power_requirements: string;
  firmware_version: string;
  software_version: string;
  accessories: string;
  // Calibration program
  calibration_interval_days: string;
  calibration_traceability: string;
  accreditation_body: string;
  last_calibration_date: string;
  notes: string;
};

export const blankEquipmentForm: EquipmentFormState = {
  name: '', asset_tag: '', category: 'Tensile', sub_type: '', status: 'Active',
  manufacturer: '', model: '', serial_number: '', vendor: '',
  purchase_date: '', purchase_cost: '', currency: 'USD', warranty_until: '',
  location: '', room: '', bench: '', assigned_operator: '',
  condition_rating: '', photo_url: '',
  measurement_min: '', measurement_max: '', measurement_unit: '',
  accuracy: '', resolution: '',
  operating_temp_min: '', operating_temp_max: '',
  operating_humidity_min: '', operating_humidity_max: '',
  power_requirements: '', firmware_version: '', software_version: '', accessories: '',
  calibration_interval_days: '', calibration_traceability: '', accreditation_body: '',
  last_calibration_date: '', notes: '',
};

export function equipmentFormToPayload(f: EquipmentFormState) {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  const txt = (v: string) => (v.trim() === '' ? null : v.trim());
  return {
    name: f.name.trim(),
    asset_tag: txt(f.asset_tag),
    category: f.category,
    sub_type: txt(f.sub_type),
    status: f.status,
    manufacturer: txt(f.manufacturer),
    model: txt(f.model),
    serial_number: txt(f.serial_number),
    vendor: txt(f.vendor),
    purchase_date: txt(f.purchase_date),
    purchase_cost: num(f.purchase_cost),
    currency: f.currency || null,
    warranty_until: txt(f.warranty_until),
    location: txt(f.location),
    room: txt(f.room),
    bench: txt(f.bench),
    assigned_operator: txt(f.assigned_operator),
    condition_rating: f.condition_rating ? Number(f.condition_rating) : null,
    photo_url: txt(f.photo_url),
    measurement_min: num(f.measurement_min),
    measurement_max: num(f.measurement_max),
    measurement_unit: txt(f.measurement_unit),
    accuracy: txt(f.accuracy),
    resolution: txt(f.resolution),
    operating_temp_min: num(f.operating_temp_min),
    operating_temp_max: num(f.operating_temp_max),
    operating_humidity_min: num(f.operating_humidity_min),
    operating_humidity_max: num(f.operating_humidity_max),
    power_requirements: txt(f.power_requirements),
    firmware_version: txt(f.firmware_version),
    software_version: txt(f.software_version),
    accessories: txt(f.accessories),
    calibration_interval_days: f.calibration_interval_days ? Number(f.calibration_interval_days) : null,
    calibration_traceability: txt(f.calibration_traceability),
    accreditation_body: txt(f.accreditation_body),
    last_calibration_date: txt(f.last_calibration_date),
    notes: txt(f.notes),
  };
}

export function rowToEquipmentForm(row: any): EquipmentFormState {
  return {
    name: row.name || '', asset_tag: row.asset_tag || '',
    category: row.category || 'Tensile', sub_type: row.sub_type || '',
    status: row.status || 'Active',
    manufacturer: row.manufacturer || '', model: row.model || '', serial_number: row.serial_number || '',
    vendor: row.vendor || '',
    purchase_date: row.purchase_date || '', purchase_cost: row.purchase_cost?.toString() || '',
    currency: row.currency || 'USD', warranty_until: row.warranty_until || '',
    location: row.location || '', room: row.room || '', bench: row.bench || '',
    assigned_operator: row.assigned_operator || '',
    condition_rating: row.condition_rating?.toString() || '',
    photo_url: row.photo_url || '',
    measurement_min: row.measurement_min?.toString() || '',
    measurement_max: row.measurement_max?.toString() || '',
    measurement_unit: row.measurement_unit || '',
    accuracy: row.accuracy || '', resolution: row.resolution || '',
    operating_temp_min: row.operating_temp_min?.toString() || '',
    operating_temp_max: row.operating_temp_max?.toString() || '',
    operating_humidity_min: row.operating_humidity_min?.toString() || '',
    operating_humidity_max: row.operating_humidity_max?.toString() || '',
    power_requirements: row.power_requirements || '',
    firmware_version: row.firmware_version || '',
    software_version: row.software_version || '',
    accessories: row.accessories || '',
    calibration_interval_days: row.calibration_interval_days?.toString() || '',
    calibration_traceability: row.calibration_traceability || '',
    accreditation_body: row.accreditation_body || '',
    last_calibration_date: row.last_calibration_date || '',
    notes: row.notes || '',
  };
}

export function validateEquipmentForm(f: EquipmentFormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.name.trim()) e.name = 'Name is required';
  if (f.name.length > 200) e.name = 'Max 200 characters';
  if (f.condition_rating) {
    const n = Number(f.condition_rating);
    if (!Number.isInteger(n) || n < 1 || n > 5) e.condition_rating = 'Must be 1–5';
  }
  if (f.calibration_interval_days) {
    const n = Number(f.calibration_interval_days);
    if (!Number.isInteger(n) || n <= 0) e.calibration_interval_days = 'Positive integer';
  }
  if (f.measurement_min && f.measurement_max && Number(f.measurement_min) > Number(f.measurement_max)) {
    e.measurement_max = 'Max must be ≥ min';
  }
  if (f.operating_temp_min && f.operating_temp_max && Number(f.operating_temp_min) > Number(f.operating_temp_max)) {
    e.operating_temp_max = 'Max must be ≥ min';
  }
  if (f.operating_humidity_min && Number(f.operating_humidity_min) < 0) e.operating_humidity_min = 'Must be ≥ 0';
  if (f.operating_humidity_max && Number(f.operating_humidity_max) > 100) e.operating_humidity_max = 'Must be ≤ 100';
  return e;
}

type Props = {
  form: EquipmentFormState;
  setForm: (updater: (f: EquipmentFormState) => EquipmentFormState) => void;
  errors: Record<string, string>;
};

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

export function EquipmentFormFields({ form, setForm, errors }: Props) {
  const set = (k: keyof EquipmentFormState) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const subtypeSuggestions = EQUIPMENT_SUBTYPES[form.category] || [];

  return (
    <Accordion type="multiple" defaultValue={['identity', 'location', 'calibration']} className="w-full">
      {/* IDENTITY */}
      <AccordionItem value="identity">
        <AccordionTrigger className="text-sm font-semibold">Identity & Classification</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name" required error={errors.name}>
              <Input value={form.name} onChange={e => set('name')(e.target.value)} />
            </Field>
            <Field label="Asset Tag">
              <Input value={form.asset_tag} onChange={e => set('asset_tag')(e.target.value)} placeholder="e.g. EQ-0042" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Category" required>
              <Select value={form.category} onValueChange={set('category')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sub-type">
              <Input
                value={form.sub_type}
                onChange={e => set('sub_type')(e.target.value)}
                list="equipment-subtype-suggestions"
                placeholder={subtypeSuggestions[0] || 'e.g. Martindale'}
              />
              <datalist id="equipment-subtype-suggestions">
                {subtypeSuggestions.map(s => <option key={s} value={s} />)}
              </datalist>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Manufacturer">
              <Input value={form.manufacturer} onChange={e => set('manufacturer')(e.target.value)} />
            </Field>
            <Field label="Model">
              <Input value={form.model} onChange={e => set('model')(e.target.value)} />
            </Field>
            <Field label="Serial Number">
              <Input value={form.serial_number} onChange={e => set('serial_number')(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Status" required>
              <Select value={form.status} onValueChange={set('status')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Condition Rating (1–5)" error={errors.condition_rating}>
              <Input type="number" min="1" max="5" value={form.condition_rating} onChange={e => set('condition_rating')(e.target.value)} />
            </Field>
          </div>
          <Field label="Photo URL">
            <Input value={form.photo_url} onChange={e => set('photo_url')(e.target.value)} placeholder="https://…" />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* PROCUREMENT */}
      <AccordionItem value="procurement">
        <AccordionTrigger className="text-sm font-semibold">Procurement & Warranty</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Vendor / Supplier">
              <Input value={form.vendor} onChange={e => set('vendor')(e.target.value)} />
            </Field>
            <Field label="Purchase Date">
              <Input type="date" value={form.purchase_date} onChange={e => set('purchase_date')(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Purchase Cost">
              <Input type="number" step="0.01" value={form.purchase_cost} onChange={e => set('purchase_cost')(e.target.value)} />
            </Field>
            <Field label="Currency">
              <Input value={form.currency} onChange={e => set('currency')(e.target.value)} placeholder="USD" />
            </Field>
            <Field label="Warranty Until">
              <Input type="date" value={form.warranty_until} onChange={e => set('warranty_until')(e.target.value)} />
            </Field>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* LOCATION */}
      <AccordionItem value="location">
        <AccordionTrigger className="text-sm font-semibold">Location & Operator</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Lab / Building">
              <Input value={form.location} onChange={e => set('location')(e.target.value)} placeholder="e.g. Lab A" />
            </Field>
            <Field label="Room">
              <Input value={form.room} onChange={e => set('room')(e.target.value)} />
            </Field>
            <Field label="Bench / Slot">
              <Input value={form.bench} onChange={e => set('bench')(e.target.value)} />
            </Field>
          </div>
          <Field label="Assigned Operator">
            <Input value={form.assigned_operator} onChange={e => set('assigned_operator')(e.target.value)} />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* TECHNICAL */}
      <AccordionItem value="technical">
        <AccordionTrigger className="text-sm font-semibold">Technical Capabilities</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Measurement Min">
              <Input type="number" step="any" value={form.measurement_min} onChange={e => set('measurement_min')(e.target.value)} />
            </Field>
            <Field label="Measurement Max" error={errors.measurement_max}>
              <Input type="number" step="any" value={form.measurement_max} onChange={e => set('measurement_max')(e.target.value)} />
            </Field>
            <Field label="Unit">
              <Input value={form.measurement_unit} onChange={e => set('measurement_unit')(e.target.value)} placeholder="N, kPa, %, …" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Accuracy">
              <Input value={form.accuracy} onChange={e => set('accuracy')(e.target.value)} placeholder="±0.5%" />
            </Field>
            <Field label="Resolution">
              <Input value={form.resolution} onChange={e => set('resolution')(e.target.value)} placeholder="0.01 N" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Operating Temp Min (°C)">
              <Input type="number" step="any" value={form.operating_temp_min} onChange={e => set('operating_temp_min')(e.target.value)} />
            </Field>
            <Field label="Operating Temp Max (°C)" error={errors.operating_temp_max}>
              <Input type="number" step="any" value={form.operating_temp_max} onChange={e => set('operating_temp_max')(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Operating Humidity Min (%)" error={errors.operating_humidity_min}>
              <Input type="number" step="any" value={form.operating_humidity_min} onChange={e => set('operating_humidity_min')(e.target.value)} />
            </Field>
            <Field label="Operating Humidity Max (%)" error={errors.operating_humidity_max}>
              <Input type="number" step="any" value={form.operating_humidity_max} onChange={e => set('operating_humidity_max')(e.target.value)} />
            </Field>
          </div>
          <Field label="Power Requirements">
            <Input value={form.power_requirements} onChange={e => set('power_requirements')(e.target.value)} placeholder="220 V / 50 Hz / 1.5 kW" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Firmware Version">
              <Input value={form.firmware_version} onChange={e => set('firmware_version')(e.target.value)} />
            </Field>
            <Field label="Software Version">
              <Input value={form.software_version} onChange={e => set('software_version')(e.target.value)} />
            </Field>
          </div>
          <Field label="Accessories">
            <Textarea rows={2} value={form.accessories} onChange={e => set('accessories')(e.target.value)} placeholder="Load cells, fixtures, weights…" />
          </Field>
        </AccordionContent>
      </AccordionItem>

      {/* CALIBRATION PROGRAM */}
      <AccordionItem value="calibration">
        <AccordionTrigger className="text-sm font-semibold">Calibration Program</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Calibration Interval (days)" error={errors.calibration_interval_days}>
              <Input type="number" min="1" value={form.calibration_interval_days} onChange={e => set('calibration_interval_days')(e.target.value)} placeholder="e.g. 365" />
            </Field>
            <Field label="Last Calibration Date">
              <Input type="date" value={form.last_calibration_date} onChange={e => set('last_calibration_date')(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Traceability">
              <Select value={form.calibration_traceability} onValueChange={set('calibration_traceability')}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {TRACEABILITY_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Accreditation Body">
              <Input value={form.accreditation_body} onChange={e => set('accreditation_body')(e.target.value)} placeholder="e.g. A2LA, JAB" />
            </Field>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Next calibration due will be auto-computed from last calibration + interval, and refreshed when calibration records are added.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* NOTES */}
      <AccordionItem value="notes">
        <AccordionTrigger className="text-sm font-semibold">Notes</AccordionTrigger>
        <AccordionContent className="pt-2">
          <Textarea rows={3} value={form.notes} onChange={e => set('notes')(e.target.value)} placeholder="Anything else worth recording" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
