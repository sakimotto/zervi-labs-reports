import { useState, useEffect } from 'react';
import { useCreateSample, useNextSampleId } from '@/hooks/useSamples';
import { useTestPrograms } from '@/hooks/useTestPrograms';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useOemSpecifications } from '@/hooks/useReferenceData';
import { useMaterials } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { DbSampleInsert } from '@/hooks/useSamples';

interface SampleIntakeFormProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

const BASE_TYPES = ['Solvent', 'Water-Based'] as const;
const PRIORITIES = ['Normal', 'Urgent', 'Critical'] as const;
const FABRIC_TYPES = ['PVC', 'PU', 'Woven', 'Knitted', 'Non-woven', 'Film', 'Foam', 'Composite', 'Other'];
const APPLICATIONS = ['Main Seat', 'Doortrim', 'Headlining', 'Awning & Canopy', 'Seat Cover', 'Camping', 'Other'];

export function SampleIntakeForm({ onBack, onCreated }: SampleIntakeFormProps) {
  const { data: nextId } = useNextSampleId();
  const createSample = useCreateSample();
  const { data: programs = [] } = useTestPrograms();
  const { data: suppliers = [] } = useSuppliers();
  const { data: oemSpecs = [] } = useOemSpecifications();
  const { data: materials = [] } = useMaterials();

  const [form, setForm] = useState({
    product_name: '',
    composition: '',
    color: '',
    fabric_type: 'PVC',
    base_type: 'Solvent' as typeof BASE_TYPES[number],
    batch_number: '',
    supplier_id: '',
    supplier_name: '',
    application: '',
    oem_specification_id: '',
    oem_brand: '',
    test_conditions: '',
    technical_regulation: '',
    standard_requirement: '',
    priority: 'Normal' as typeof PRIORITIES[number],
    requested_by: '',
    test_program_id: '',
    material_id: '',
    received_date: new Date().toISOString().split('T')[0],
    test_date: '',
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  // Auto-populate from material selection
  const handleMaterialChange = (materialId: string) => {
    set('material_id', materialId);
    if (materialId) {
      const mat = materials.find(m => m.id === materialId);
      if (mat) {
        const updates: Record<string, string> = {};
        if (mat.composition) updates.composition = mat.composition;
        if (mat.color) updates.color = mat.color;
        if ((mat as any).default_test_program_id) updates.test_program_id = (mat as any).default_test_program_id;
        if (mat.material_type) updates.fabric_type = mat.material_type;
        setForm(prev => ({ ...prev, material_id: materialId, ...updates }));
      }
    }
  };

  // Auto-populate OEM brand from spec selection
  const handleOemSpecChange = (specId: string) => {
    const spec = oemSpecs.find(s => s.id === specId);
    setForm(prev => ({
      ...prev,
      oem_specification_id: specId,
      oem_brand: spec?.oem_brand || prev.oem_brand,
      technical_regulation: spec?.spec_code || prev.technical_regulation,
    }));
  };

  // Auto-populate supplier_name from supplier_id
  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setForm(prev => ({
      ...prev,
      supplier_id: supplierId,
      supplier_name: supplier?.name || '',
    }));
  };

  const handleSubmit = async () => {
    if (!form.product_name.trim()) {
      toast.error('Product name is required');
      return;
    }
    try {
      const { test_program_id, material_id, supplier_id, oem_specification_id, ...sampleData } = form;
      const result = await createSample.mutateAsync({
        sample_id: nextId || `ZV-TR-${Date.now()}`,
        ...sampleData,
        ...(test_program_id ? { test_program_id } : {}),
        ...(material_id ? { material_id } : {}),
        ...(supplier_id ? { supplier_id } : {}),
        ...(oem_specification_id ? { oem_specification_id } : {}),
      } as DbSampleInsert);

      // If a test program is selected, copy program items to sample_test_items
      if (test_program_id) {
        const { data: programItems } = await supabase
          .from('test_program_items')
          .select('test_item_id, display_order')
          .eq('program_id', test_program_id)
          .order('display_order');
        if (programItems && programItems.length > 0) {
          await supabase.from('sample_test_items').insert(
            programItems.map(pi => ({
              sample_id: result.id,
              test_item_id: pi.test_item_id,
              display_order: pi.display_order,
            }))
          );
        }
      }

      toast.success(`Test ${result.sample_id} created`);
      onCreated(result.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create test');
    }
  };

  // Group OEM specs by brand for display
  const oemBrands = [...new Set(oemSpecs.map(s => s.oem_brand))];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-muted rounded transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">New Test</span>
        </div>
        <button onClick={handleSubmit} disabled={createSample.isPending}
          className="h-8 px-4 flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
          <Save className="h-3.5 w-3.5" />
          {createSample.isPending ? 'Saving...' : 'Create Test'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-card rounded-lg shadow-card p-6">
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Test ID</div>
            <div className="text-lg font-mono font-bold text-primary">{nextId || '...'}</div>
          </div>

          {/* Material & Program Section */}
          <div className="mb-4 pb-4 border-b">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Material & Test Program</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <SelectField label="Material" value={form.material_id} options={[{ value: '', label: '— Select Material —' }, ...materials.map(m => ({ value: m.id, label: `${m.name} (${m.material_type})` }))]} onChange={handleMaterialChange} />
              <SelectField label="Test Program" value={form.test_program_id} options={[{ value: '', label: 'None (all tests)' }, ...programs.map(p => ({ value: p.id, label: `${p.name}${p.material_type ? ` — ${p.material_type}` : ''}` }))]} onChange={v => set('test_program_id', v)} />
            </div>
          </div>

          {/* Product Info */}
          <div className="mb-4 pb-4 border-b">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Product Information</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Product Name *" value={form.product_name} onChange={v => set('product_name', v)} />
              <Field label="Composition" value={form.composition} onChange={v => set('composition', v)} placeholder="e.g. 65% Polyester / 35% Cotton" />
              <Field label="Color" value={form.color} onChange={v => set('color', v)} />
              <SelectField label="Fabric Type" value={form.fabric_type} options={FABRIC_TYPES.map(t => ({ value: t, label: t }))} onChange={v => set('fabric_type', v)} />
              <SelectField label="Base Type" value={form.base_type} options={BASE_TYPES.map(t => ({ value: t, label: t }))} onChange={v => set('base_type', v)} />
              <SelectField label="Application" value={form.application} options={[{ value: '', label: '— Select —' }, ...APPLICATIONS.map(a => ({ value: a, label: a }))]} onChange={v => set('application', v)} />
              <Field label="Batch Number" value={form.batch_number} onChange={v => set('batch_number', v)} />
            </div>
          </div>

          {/* Source & Standards */}
          <div className="mb-4 pb-4 border-b">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Source & Standards</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <SelectField label="Supplier" value={form.supplier_id} options={[{ value: '', label: '— Select Supplier —' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]} onChange={handleSupplierChange} />
              <SelectField label="OEM Specification" value={form.oem_specification_id} options={[{ value: '', label: '— Select OEM Spec —' }, ...oemSpecs.map(s => ({ value: s.id, label: `${s.oem_brand} — ${s.spec_code}${s.version ? ` (${s.version})` : ''}` }))]} onChange={handleOemSpecChange} />
              <Field label="Technical Regulation" value={form.technical_regulation} onChange={v => set('technical_regulation', v)} placeholder="Auto-filled from OEM Spec" />
              <Field label="Standard Requirement" value={form.standard_requirement} onChange={v => set('standard_requirement', v)} placeholder="e.g. ES-X60450" />
            </div>
          </div>

          {/* Testing Details */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Testing Details</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <SelectField label="Priority" value={form.priority} options={PRIORITIES.map(p => ({ value: p, label: p }))} onChange={v => set('priority', v)} />
              <Field label="Requested By" value={form.requested_by} onChange={v => set('requested_by', v)} />
              <DateField label="Received Date" value={form.received_date} onChange={v => set('received_date', v)} />
              <DateField label="Test Date" value={form.test_date} onChange={v => set('test_date', v)} />
              <Field label="Test Conditions" value={form.test_conditions} onChange={v => set('test_conditions', v)} placeholder="e.g. 23°C ± 2°C, 50% ± 5% RH" />
            </div>
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
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" />
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[] | string[]; onChange: (v: string) => void }) {
  const normalized = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50">
        {normalized.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
