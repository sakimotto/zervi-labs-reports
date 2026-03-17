import { useState } from 'react';
import { useCreateSample, useNextSampleId } from '@/hooks/useSamples';
import { ArrowLeft, FlaskConical, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { DbSampleInsert } from '@/hooks/useSamples';

interface SampleIntakeFormProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

const OEM_OPTIONS = ['Mitsubishi', 'Nissan', 'ARB', 'Razorback4x4', 'Other'];
const BASE_TYPES = ['Solvent', 'Water-Based'] as const;
const PRIORITIES = ['Normal', 'Urgent', 'Critical'] as const;
const COMPOSITIONS = ['PVC', 'PU', 'Polyester', 'Nylon', 'Cotton', 'Other'];
const APPLICATIONS = ['Main Seat', 'Doortrim', 'Headlining', 'Awning & Canopy', 'Seat Cover', 'Camping', 'Other'];

export function SampleIntakeForm({ onBack, onCreated }: SampleIntakeFormProps) {
  const { data: nextId } = useNextSampleId();
  const createSample = useCreateSample();

  const [form, setForm] = useState({
    product_name: '',
    composition: 'PVC',
    color: '',
    fabric_type: 'PVC',
    base_type: 'Solvent' as typeof BASE_TYPES[number],
    batch_number: '',
    supplier_name: '',
    application: '',
    oem_brand: 'Mitsubishi',
    test_conditions: '',
    technical_regulation: '',
    standard_requirement: '',
    priority: 'Normal' as typeof PRIORITIES[number],
    requested_by: '',
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.product_name.trim()) {
      toast.error('Product name is required');
      return;
    }
    try {
      const result = await createSample.mutateAsync({
        sample_id: nextId || `ZV-LAB-${Date.now()}`,
        ...form,
      } as DbSampleInsert);
      toast.success(`Sample ${result.sample_id} created`);
      onCreated(result.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create sample');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 flex items-center justify-between px-4 border-b bg-card shadow-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-muted rounded transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <FlaskConical className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold tracking-tight">ZERVI ASIA LABORATORY</span>
          <span className="text-xs text-muted-foreground">/ New Sample</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={createSample.isPending}
          className="h-8 px-4 flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {createSample.isPending ? 'Saving...' : 'Create Sample'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-card rounded-lg shadow-card p-6">
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Sample ID</div>
            <div className="text-lg font-mono font-bold text-primary">{nextId || '...'}</div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Product Name *" value={form.product_name} onChange={v => set('product_name', v)} />
            <SelectField label="OEM / Brand" value={form.oem_brand} options={OEM_OPTIONS} onChange={v => set('oem_brand', v)} />
            <SelectField label="Composition" value={form.composition} options={COMPOSITIONS} onChange={v => set('composition', v)} />
            <Field label="Color" value={form.color} onChange={v => set('color', v)} />
            <Field label="Fabric Type" value={form.fabric_type} onChange={v => set('fabric_type', v)} />
            <SelectField label="Base Type" value={form.base_type} options={[...BASE_TYPES]} onChange={v => set('base_type', v)} />
            <Field label="Batch Number" value={form.batch_number} onChange={v => set('batch_number', v)} />
            <Field label="Supplier Name" value={form.supplier_name} onChange={v => set('supplier_name', v)} />
            <SelectField label="Application" value={form.application} options={APPLICATIONS} onChange={v => set('application', v)} />
            <SelectField label="Priority" value={form.priority} options={[...PRIORITIES]} onChange={v => set('priority', v)} />
            <Field label="Test Conditions" value={form.test_conditions} onChange={v => set('test_conditions', v)} placeholder="e.g. Temp 27°C RH 53%" />
            <Field label="Requested By" value={form.requested_by} onChange={v => set('requested_by', v)} />
            <Field label="Technical Regulation" value={form.technical_regulation} onChange={v => set('technical_regulation', v)} placeholder="e.g. ES-X-83217" />
            <Field label="Standard Requirement" value={form.standard_requirement} onChange={v => set('standard_requirement', v)} placeholder="e.g. ES-X60450" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
