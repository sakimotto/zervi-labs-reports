import { useState, useMemo } from 'react';
import { useCreateSample, useNextSampleId } from '@/hooks/useSamples';
import { useTestPrograms } from '@/hooks/useTestPrograms';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useOemSpecifications } from '@/hooks/useReferenceData';
import { useMaterials } from '@/hooks/useMaterials';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Save,
  ArrowRight,
  Beaker,
  Package,
  ClipboardList,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DbSampleInsert } from '@/hooks/useSamples';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormSection,
  FormGrid,
  FormField,
  FormInput,
  StepIndicator,
} from '@/components/form/FormPrimitives';
import { SkuPicker } from '@/components/form/SkuPicker';

interface SampleIntakeFormProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

const BASE_TYPES = ['Solvent', 'Water-Based'] as const;
const PRIORITIES = ['Normal', 'Urgent', 'Critical'] as const;
const FABRIC_TYPES = ['PVC', 'PU', 'Woven', 'Knitted', 'Non-woven', 'Film', 'Foam', 'Composite', 'Other'];
const APPLICATIONS = ['Main Seat', 'Doortrim', 'Headlining', 'Awning & Canopy', 'Seat Cover', 'Camping', 'Other'];

const STEPS = [
  { label: 'Material & Program', description: 'Pick template', icon: Beaker },
  { label: 'Product & Source', description: 'Identification', icon: Package },
  { label: 'Testing Details', description: 'Schedule & priority', icon: ClipboardList },
];

type FormState = {
  product_name: string;
  composition: string;
  color: string;
  fabric_type: string;
  base_type: typeof BASE_TYPES[number];
  batch_number: string;
  sku: string;
  is_temp_sku: boolean;
  supplier_id: string;
  supplier_name: string;
  application: string;
  oem_specification_id: string;
  oem_brand: string;
  test_conditions: string;
  technical_regulation: string;
  standard_requirement: string;
  priority: typeof PRIORITIES[number];
  requested_by: string;
  test_program_id: string;
  material_id: string;
  received_date: string;
  test_date: string;
};

export function SampleIntakeForm({ onBack, onCreated }: SampleIntakeFormProps) {
  const { data: nextId } = useNextSampleId();
  const createSample = useCreateSample();
  const { data: programs = [] } = useTestPrograms();
  const { data: suppliers = [] } = useSuppliers();
  const { data: oemSpecs = [] } = useOemSpecifications();
  const { data: materials = [] } = useMaterials();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    product_name: '',
    composition: '',
    color: '',
    fabric_type: 'PVC',
    base_type: 'Solvent',
    batch_number: '',
    sku: '',
    is_temp_sku: false,
    supplier_id: '',
    supplier_name: '',
    application: '',
    oem_specification_id: '',
    oem_brand: '',
    test_conditions: '',
    technical_regulation: '',
    standard_requirement: '',
    priority: 'Normal',
    requested_by: '',
    test_program_id: '',
    material_id: '',
    received_date: new Date().toISOString().split('T')[0],
    test_date: '',
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === form.material_id),
    [materials, form.material_id],
  );
  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === form.test_program_id),
    [programs, form.test_program_id],
  );

  // Auto-populate from material selection
  const handleMaterialChange = (materialId: string) => {
    const id = materialId === '__none__' ? '' : materialId;
    if (!id) {
      set('material_id', '');
      return;
    }
    const mat = materials.find((m) => m.id === id);
    if (!mat) {
      set('material_id', id);
      return;
    }
    setForm((prev) => ({
      ...prev,
      material_id: id,
      ...(mat.composition ? { composition: mat.composition } : {}),
      ...(mat.color ? { color: mat.color } : {}),
      ...((mat as any).default_test_program_id
        ? { test_program_id: (mat as any).default_test_program_id }
        : {}),
      ...(mat.material_type ? { fabric_type: mat.material_type } : {}),
      ...(mat.material_code ? { sku: mat.material_code, is_temp_sku: false } : {}),
    }));
    toast.success(`Auto-filled from “${mat.name}”`, {
      description: 'Composition, color, and test program populated.',
    });
  };

  // Auto-populate OEM brand from spec selection
  const handleOemSpecChange = (specId: string) => {
    const id = specId === '__none__' ? '' : specId;
    const spec = oemSpecs.find((s) => s.id === id);
    setForm((prev) => ({
      ...prev,
      oem_specification_id: id,
      oem_brand: spec?.oem_brand || prev.oem_brand,
      technical_regulation: spec?.spec_code || prev.technical_regulation,
    }));
  };

  // Auto-populate supplier_name from supplier_id
  const handleSupplierChange = (supplierId: string) => {
    const id = supplierId === '__none__' ? '' : supplierId;
    const supplier = suppliers.find((s) => s.id === id);
    setForm((prev) => ({
      ...prev,
      supplier_id: id,
      supplier_name: supplier?.name || '',
    }));
  };

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.product_name.trim()) e.product_name = 'Product name is required';
    }
    return e;
  };

  const goNext = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    // Validate every step
    const allErrors = { ...validateStep(0), ...validateStep(1), ...validateStep(2) };
    setErrors(allErrors);
    if (Object.keys(allErrors).length) {
      // jump to first step with an error
      if (allErrors.product_name) setStep(1);
      toast.error('Please review required fields');
      return;
    }

    try {
      const {
        test_program_id,
        material_id,
        supplier_id,
        oem_specification_id,
        test_date,
        received_date,
        ...sampleData
      } = form;
      const result = await createSample.mutateAsync({
        sample_id: nextId || `ZV-TR-${Date.now()}`,
        ...sampleData,
        ...(test_date ? { test_date } : {}),
        ...(received_date ? { received_date } : {}),
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
            programItems.map((pi) => ({
              sample_id: result.id,
              test_item_id: pi.test_item_id,
              display_order: pi.display_order,
            })),
          );
        }
      }

      toast.success(`Test ${result.sample_id} created`);
      onCreated(result.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create test');
    }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md px-6 py-3 sticky top-0 z-30 shrink-0">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                New Test
              </div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span className="font-mono text-primary">{nextId || '…'}</span>
                {form.product_name && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="truncate">{form.product_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={
                form.priority === 'Critical'
                  ? 'bg-destructive/10 text-destructive border-destructive/30'
                  : form.priority === 'Urgent'
                    ? 'bg-warning-soft text-warning border-warning/30'
                    : 'bg-muted text-muted-foreground'
              }
            >
              {form.priority}
            </Badge>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-border bg-card shadow-xs">
        <div className="max-w-5xl mx-auto">
          <StepIndicator
            steps={STEPS.map((s) => ({ label: s.label, description: s.description }))}
            current={step}
            onJump={(i) => setStep(i)}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
          {step === 0 && (
            <Step0
              form={form}
              set={set}
              materials={materials}
              programs={programs}
              selectedMaterial={selectedMaterial}
              selectedProgram={selectedProgram}
              onMaterialChange={handleMaterialChange}
            />
          )}
          {step === 1 && (
            <Step1
              form={form}
              set={set}
              errors={errors}
              suppliers={suppliers}
              oemSpecs={oemSpecs}
              onSupplierChange={handleSupplierChange}
              onOemSpecChange={handleOemSpecChange}
              onMaterialChange={handleMaterialChange}
            />
          )}
          {step === 2 && <Step2 form={form} set={set} />}
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="border-t border-border bg-card/95 backdrop-blur-md px-6 py-3 sticky bottom-0 z-30 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Step <span className="font-semibold text-foreground">{step + 1}</span> of {STEPS.length}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={goBack} size="sm" className="h-9">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onBack}
              size="sm"
              className="h-9 text-muted-foreground"
            >
              Cancel
            </Button>
            {!isLast ? (
              <Button onClick={goNext} size="sm" className="h-9">
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createSample.isPending}
                size="sm"
                className="h-9"
              >
                <Save className="h-4 w-4 mr-1" />
                {createSample.isPending ? 'Creating…' : 'Create Test'}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * STEP 0 — Material & Program (start with template)
 * ──────────────────────────────────────────────────────────── */
function Step0({
  form,
  set,
  materials,
  programs,
  selectedMaterial,
  selectedProgram,
  onMaterialChange,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  materials: any[];
  programs: any[];
  selectedMaterial?: any;
  selectedProgram?: any;
  onMaterialChange: (id: string) => void;
}) {
  return (
    <>
      <FormSection
        icon={Beaker}
        title="Start from a material"
        description="Pick a registered material to auto-fill composition, color, and test program. Optional — you can also enter a one-off product on the next step."
      >
        <FormGrid cols={1}>
          <FormField label="Material">
            <Select
              value={form.material_id || '__none__'}
              onValueChange={onMaterialChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="— Select material —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None — enter manually</SelectItem>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}{' '}
                    <span className="text-muted-foreground ml-1">({m.material_type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {selectedMaterial && (
            <div className="rounded-md border border-primary/20 bg-primary-soft/40 p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs flex-1 min-w-0">
                <div className="font-semibold text-foreground">
                  {selectedMaterial.name}{' '}
                  {selectedMaterial.material_code && (
                    <span className="text-muted-foreground font-mono ml-1">
                      {selectedMaterial.material_code}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground mt-0.5">
                  {[selectedMaterial.composition, selectedMaterial.color]
                    .filter(Boolean)
                    .join(' · ') || 'No spec details'}
                </div>
              </div>
            </div>
          )}
        </FormGrid>
      </FormSection>

      <FormSection
        icon={ClipboardList}
        title="Test program"
        description="Determines which tests will be run. Leave blank to add tests manually after creation."
      >
        <FormGrid cols={1}>
          <FormField label="Program">
            <Select
              value={form.test_program_id || '__none__'}
              onValueChange={(v) => set('test_program_id', v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="— None (add tests later) —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None — add tests later</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.material_type && (
                      <span className="text-muted-foreground ml-1">— {p.material_type}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {selectedProgram && (
            <div className="rounded-md border border-primary/20 bg-primary-soft/40 p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs flex-1 min-w-0">
                <div className="font-semibold text-foreground">{selectedProgram.name}</div>
                <div className="text-muted-foreground mt-0.5">
                  Tests from this program will be added automatically.
                </div>
              </div>
            </div>
          )}
        </FormGrid>
      </FormSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
 * STEP 1 — Product & Source
 * ──────────────────────────────────────────────────────────── */
function Step1({
  form,
  set,
  errors,
  suppliers,
  oemSpecs,
  onSupplierChange,
  onOemSpecChange,
  onMaterialChange,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
  suppliers: any[];
  oemSpecs: any[];
  onSupplierChange: (id: string) => void;
  onOemSpecChange: (id: string) => void;
  onMaterialChange: (id: string) => void;
}) {
  return (
    <>
      <FormSection
        icon={Package}
        title="Product information"
        description="Describe what's being tested."
      >
        <FormGrid cols={2}>
          <FormField label="Product name" required error={errors.product_name} span="full">
            <FormInput
              value={form.product_name}
              error={!!errors.product_name}
              onChange={(e) => set('product_name', e.target.value)}
              placeholder="e.g. Premium Vinyl Coated Fabric"
              autoFocus
            />
          </FormField>

          <FormField label="Composition" hint="Auto-filled if material picked">
            <FormInput
              value={form.composition}
              onChange={(e) => set('composition', e.target.value)}
              placeholder="e.g. 65% Polyester / 35% Cotton"
            />
          </FormField>

          <FormField label="Color">
            <FormInput
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
              placeholder="e.g. Charcoal Black"
            />
          </FormField>

          <FormField label="Fabric type">
            <Select value={form.fabric_type} onValueChange={(v) => set('fabric_type', v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FABRIC_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Base type">
            <Select
              value={form.base_type}
              onValueChange={(v) => set('base_type', v as FormState['base_type'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Application">
            <Select
              value={form.application || '__none__'}
              onValueChange={(v) => set('application', v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="— Select —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {APPLICATIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Batch number">
            <FormInput
              value={form.batch_number}
              onChange={(e) => set('batch_number', e.target.value)}
              placeholder="e.g. LOT-2024-0421"
            />
          </FormField>

          <FormField
            label="SKU / Part No."
            hint="Search the catalog or toggle Override for a temporary SKU (e.g. new supplier sample)."
            span="full"
          >
            <SkuPicker
              value={form.sku}
              isTemp={form.is_temp_sku}
              materialId={form.material_id}
              onChange={(v, isTemp, materialId) => {
                if (materialId && materialId !== form.material_id) {
                  // Picking a catalog material auto-fills composition/color/program
                  onMaterialChange(materialId);
                  // SkuPicker also passed the SKU — set it explicitly in case material_code is empty
                  set('sku', v);
                  set('is_temp_sku', false);
                } else {
                  set('sku', v);
                  set('is_temp_sku', isTemp);
                  if (!isTemp && !materialId) set('material_id', '');
                }
              }}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection
        icon={ClipboardList}
        title="Source & standards"
        description="Where it came from and which spec applies."
      >
        <FormGrid cols={2}>
          <FormField label="Supplier">
            <Select
              value={form.supplier_id || '__none__'}
              onValueChange={onSupplierChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="— Select supplier —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="OEM specification">
            <Select
              value={form.oem_specification_id || '__none__'}
              onValueChange={onOemSpecChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="— Select OEM spec —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {oemSpecs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.oem_brand} — {s.spec_code}
                    {s.version ? ` (${s.version})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Technical regulation" hint="Auto-filled from OEM spec">
            <FormInput
              value={form.technical_regulation}
              onChange={(e) => set('technical_regulation', e.target.value)}
              placeholder="e.g. TS-1234"
            />
          </FormField>

          <FormField label="Standard requirement">
            <FormInput
              value={form.standard_requirement}
              onChange={(e) => set('standard_requirement', e.target.value)}
              placeholder="e.g. ES-X60450"
            />
          </FormField>
        </FormGrid>
      </FormSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
 * STEP 2 — Testing details
 * ──────────────────────────────────────────────────────────── */
function Step2({
  form,
  set,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <>
      <FormSection
        icon={ClipboardList}
        title="Schedule & priority"
        description="When testing should happen and who requested it."
      >
        <FormGrid cols={2}>
          <FormField label="Priority">
            <Select
              value={form.priority}
              onValueChange={(v) => set('priority', v as FormState['priority'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Requested by">
            <FormInput
              value={form.requested_by}
              onChange={(e) => set('requested_by', e.target.value)}
              placeholder="e.g. Engineering team"
            />
          </FormField>

          <FormField label="Received date">
            <FormInput
              type="date"
              value={form.received_date}
              onChange={(e) => set('received_date', e.target.value)}
            />
          </FormField>

          <FormField label="Test date" hint="Optional — leave blank if unscheduled">
            <FormInput
              type="date"
              value={form.test_date}
              onChange={(e) => set('test_date', e.target.value)}
            />
          </FormField>

          <FormField label="Test conditions" span="full">
            <FormInput
              value={form.test_conditions}
              onChange={(e) => set('test_conditions', e.target.value)}
              placeholder="e.g. 23°C ± 2°C, 50% ± 5% RH"
            />
          </FormField>
        </FormGrid>
      </FormSection>

      {/* Summary card */}
      <FormSection
        icon={Sparkles}
        title="Ready to create"
        description="Review the summary before creating the test."
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <SummaryRow label="Product" value={form.product_name || <em className="text-destructive">Required</em>} />
          <SummaryRow label="Composition" value={form.composition} />
          <SummaryRow label="Fabric type" value={form.fabric_type} />
          <SummaryRow label="Application" value={form.application} />
          <SummaryRow label="Supplier" value={form.supplier_name} />
          <SummaryRow label="OEM brand" value={form.oem_brand} />
          <SummaryRow label="Priority" value={form.priority} />
          <SummaryRow label="Test date" value={form.test_date || 'Unscheduled'} />
        </dl>
        {!form.product_name && (
          <p className="text-[11px] text-destructive flex items-center gap-1 mt-3">
            <AlertCircle className="h-3 w-3" /> Product name is required — go back to Step 2.
          </p>
        )}
      </FormSection>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5">
      <dt className="text-muted-foreground uppercase tracking-wider text-[10px] shrink-0">
        {label}
      </dt>
      <dd className="font-medium text-foreground text-right truncate">{value || '—'}</dd>
    </div>
  );
}
