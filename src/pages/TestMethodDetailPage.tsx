import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Save, GitBranch, Loader2, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStandards } from '@/hooks/useReferenceData';
import { useEquipment } from '@/hooks/useEquipment';
import {
  useMethod, useUpdateMethod,
  useMethodVersions, useMethodStandards, useMethodEquipment,
  useMethodDirections, useMethodConditioning, useMethodProcedureSteps,
  useMethodParameters, useMethodCalculations, useMethodAcceptance,
  useMethodAudit,
  useInsertRelation, useUpdateRelation, useDeleteRelation,
  createMethodVersion,
} from '@/hooks/useMethodDetail';
import { useQueryClient } from '@tanstack/react-query';

const CATEGORIES = ['Physical', 'Mechanical', 'Durability', 'Chemical', 'Safety', 'Visual', 'Other'];
const STATUSES = ['Draft', 'Active', 'Archived'];
const DIRECTIONS = ['Warp', 'Weft', 'Machine', 'Cross', 'Bias', 'None'] as const;
const ROUNDING = ['half-up', 'half-down', 'half-even', 'truncate', 'ceiling', 'floor'] as const;

export default function TestMethodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const testItemId = id ? parseInt(id, 10) : null;
  const { data: method, isLoading } = useMethod(testItemId);
  const updateMethod = useUpdateMethod();
  const { data: standards = [] } = useStandards();
  const { data: equipmentList = [] } = useEquipment();

  // tab data
  const versionsQ = useMethodVersions(testItemId);
  const stdQ = useMethodStandards(testItemId);
  const eqQ = useMethodEquipment(testItemId);
  const dirQ = useMethodDirections(testItemId);
  const condQ = useMethodConditioning(testItemId);
  const procQ = useMethodProcedureSteps(testItemId);
  const paramQ = useMethodParameters(testItemId);
  const calcQ = useMethodCalculations(testItemId);
  const accQ = useMethodAcceptance(testItemId);
  const auditQ = useMethodAudit(testItemId);

  // mutations
  const insStd = useInsertRelation('method_standards');
  const delStd = useDeleteRelation('method_standards');
  const insEq = useInsertRelation('method_equipment');
  const delEq = useDeleteRelation('method_equipment');
  const insDir = useInsertRelation('method_directions');
  const delDir = useDeleteRelation('method_directions');
  const insCond = useInsertRelation('method_conditioning');
  const delCond = useDeleteRelation('method_conditioning');
  const insProc = useInsertRelation('method_procedure_steps');
  const updProc = useUpdateRelation('method_procedure_steps');
  const delProc = useDeleteRelation('method_procedure_steps');
  const insParam = useInsertRelation('method_parameters');
  const delParam = useDeleteRelation('method_parameters');
  const insCalc = useInsertRelation('method_calculations');
  const delCalc = useDeleteRelation('method_calculations');
  const insAcc = useInsertRelation('method_acceptance');
  const delAcc = useDeleteRelation('method_acceptance');

  const [basic, setBasic] = useState<any>(null);

  // local sync once loaded
  if (method && basic === null) {
    setBasic({
      name: method.name,
      category: method.category,
      method_code: (method as any).method_code,
      status: (method as any).status,
      unit: method.unit ?? '',
      summary: (method as any).summary ?? '',
      scope: (method as any).scope ?? '',
      principle: (method as any).principle ?? '',
      display_order: method.display_order ?? 0,
    });
  }

  if (isLoading || !method || !basic) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const saveBasic = async () => {
    await updateMethod.mutateAsync({ id: method.id, patch: basic });
    toast.success('Method updated');
  };

  const newVersion = async () => {
    const notes = prompt('Change notes for this new version:');
    if (notes === null) return;
    await createMethodVersion(method.id, notes);
    toast.success(`Version ${(method as any).version + 1} created`);
    qc.invalidateQueries({ queryKey: ['test-item', method.id] });
    qc.invalidateQueries({ queryKey: ['method_versions', method.id] });
    qc.invalidateQueries({ queryKey: ['method_audit', method.id] });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/test-methods')} className="p-1.5 hover:bg-muted rounded-md">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-primary">{(method as any).method_code}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-sm bg-muted font-medium">{method.category}</span>
              <StatusBadge status={(method as any).status} />
              <span className="text-xs text-muted-foreground font-mono">v{(method as any).version}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">{method.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={newVersion} className="h-9 px-3 flex items-center gap-1.5 text-sm font-medium border rounded-md hover:bg-muted transition-colors">
            <GitBranch className="h-3.5 w-3.5" /> New Version
          </button>
          <button onClick={saveBasic} disabled={updateMethod.isPending} className="h-9 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> {updateMethod.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="standards">Standards & Procedure</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="calculation">Calculation</TabsTrigger>
          <TabsTrigger value="acceptance">Acceptance & QC</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="audit">Audit & Versions</TabsTrigger>
        </TabsList>

        {/* BASIC */}
        <TabsContent value="basic" className="space-y-4">
          <Card title="Identification">
            <Grid>
              <Field label="Method Code (read-only)">
                <input value={basic.method_code} readOnly className="w-full h-9 px-3 text-sm bg-muted/50 border rounded-md font-mono cursor-not-allowed" />
              </Field>
              <Field label="Name *">
                <input value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} className="w-full h-9 px-3 text-sm bg-background border rounded-md" />
              </Field>
              <Field label="Category">
                <select value={basic.category} onChange={(e) => setBasic({ ...basic, category: e.target.value })} className="w-full h-9 px-3 text-sm bg-background border rounded-md">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={basic.status} onChange={(e) => setBasic({ ...basic, status: e.target.value })} className="w-full h-9 px-3 text-sm bg-background border rounded-md">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <input value={basic.unit} onChange={(e) => setBasic({ ...basic, unit: e.target.value })} className="w-full h-9 px-3 text-sm bg-background border rounded-md" />
              </Field>
              <Field label="Display Order">
                <input type="number" value={basic.display_order} onChange={(e) => setBasic({ ...basic, display_order: parseInt(e.target.value) || 0 })} className="w-full h-9 px-3 text-sm bg-background border rounded-md" />
              </Field>
            </Grid>
          </Card>

          <Card title="Scope & Principle (ISO 17025 §7.2.1.2)">
            <Field label="Summary">
              <input value={basic.summary} onChange={(e) => setBasic({ ...basic, summary: e.target.value })} className="w-full h-9 px-3 text-sm bg-background border rounded-md" />
            </Field>
            <Field label="Scope (what does this method measure?)">
              <textarea value={basic.scope} onChange={(e) => setBasic({ ...basic, scope: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm bg-background border rounded-md" />
            </Field>
            <Field label="Principle (scientific basis)">
              <textarea value={basic.principle} onChange={(e) => setBasic({ ...basic, principle: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm bg-background border rounded-md" />
            </Field>
          </Card>
        </TabsContent>

        {/* STANDARDS & PROCEDURE */}
        <TabsContent value="standards" className="space-y-4">
          <Card title="Normative References" action={
            <AddBtn onClick={() => insStd.mutate({ test_item_id: method.id, is_primary: (stdQ.data?.length ?? 0) === 0, display_order: stdQ.data?.length ?? 0 })} />
          }>
            <RelationTable
              loading={stdQ.isLoading}
              empty="No standards linked. Add ISO/JIS/ASTM references."
              headers={['Standard', 'Year', 'Primary', 'Notes', '']}
              rows={(stdQ.data ?? []).map((row: any) => [
                <select key="s" defaultValue={row.standard_id ?? ''} onBlur={(e) => updateRow('method_standards', row.id, method.id, { standard_id: e.target.value || null })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm">
                  <option value="">— Select —</option>
                  {standards.map((s) => <option key={s.id} value={s.id}>{s.code}{s.version ? `:${s.version}` : ''}</option>)}
                </select>,
                <input key="y" defaultValue={row.year ?? ''} onBlur={(e) => updateRow('method_standards', row.id, method.id, { year: e.target.value })} className="w-20 h-8 px-2 text-sm bg-background border rounded-sm" placeholder="2020" />,
                <input key="p" type="checkbox" defaultChecked={row.is_primary} onChange={(e) => updateRow('method_standards', row.id, method.id, { is_primary: e.target.checked })} />,
                <input key="n" defaultValue={row.notes ?? ''} onBlur={(e) => updateRow('method_standards', row.id, method.id, { notes: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <DelBtn key="d" onClick={() => delStd.mutate({ id: row.id, testItemId: method.id })} />,
              ])}
            />
          </Card>

          <Card title="Test Directions" action={
            <AddBtn onClick={() => {
              const used = new Set((dirQ.data ?? []).map((d: any) => d.direction));
              const next = DIRECTIONS.find((d) => !used.has(d));
              if (!next) { toast.error('All directions already added'); return; }
              insDir.mutate({ test_item_id: method.id, direction: next, specimens_per_direction: 3 });
            }} />
          }>
            <RelationTable
              loading={dirQ.isLoading}
              empty="No directions defined. Add Warp/Weft/etc."
              headers={['Direction', 'Specimens', 'Notes', '']}
              rows={(dirQ.data ?? []).map((row: any) => [
                <span key="d" className="text-sm font-medium">{row.direction}</span>,
                <input key="c" type="number" defaultValue={row.specimens_per_direction} onBlur={(e) => updateRow('method_directions', row.id, method.id, { specimens_per_direction: parseInt(e.target.value) || 1 })} className="w-20 h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="n" defaultValue={row.notes ?? ''} onBlur={(e) => updateRow('method_directions', row.id, method.id, { notes: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <DelBtn key="x" onClick={() => delDir.mutate({ id: row.id, testItemId: method.id })} />,
              ])}
            />
          </Card>

          <Card title="Conditioning Requirements" action={
            <AddBtn onClick={() => insCond.mutate({ test_item_id: method.id, temperature_c: 23, humidity_percent: 50, duration_hours: 24 })} />
          }>
            <RelationTable
              loading={condQ.isLoading}
              empty="No conditioning profile defined."
              headers={['Temp °C', 'Tol ±', 'RH %', 'Tol ±', 'Hours', 'Description', '']}
              rows={(condQ.data ?? []).map((row: any) => [
                <NumIn key="t" def={row.temperature_c} onSave={(v) => updateRow('method_conditioning', row.id, method.id, { temperature_c: v })} />,
                <NumIn key="tt" def={row.temperature_tolerance} onSave={(v) => updateRow('method_conditioning', row.id, method.id, { temperature_tolerance: v })} />,
                <NumIn key="h" def={row.humidity_percent} onSave={(v) => updateRow('method_conditioning', row.id, method.id, { humidity_percent: v })} />,
                <NumIn key="ht" def={row.humidity_tolerance} onSave={(v) => updateRow('method_conditioning', row.id, method.id, { humidity_tolerance: v })} />,
                <NumIn key="d" def={row.duration_hours} onSave={(v) => updateRow('method_conditioning', row.id, method.id, { duration_hours: v })} />,
                <input key="x" defaultValue={row.description ?? ''} onBlur={(e) => updateRow('method_conditioning', row.id, method.id, { description: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <DelBtn key="del" onClick={() => delCond.mutate({ id: row.id, testItemId: method.id })} />,
              ])}
            />
          </Card>

          <Card title="Procedure Steps" action={
            <AddBtn label="Add Step" onClick={() => {
              const next = (procQ.data?.length ?? 0) + 1;
              insProc.mutate({ test_item_id: method.id, step_number: next, instruction_text: '' });
            }} />
          }>
            {procQ.isLoading ? <SmallSpinner /> : (procQ.data ?? []).length === 0 ? <Empty msg="No procedure steps yet." /> : (
              <ol className="space-y-2">
                {(procQ.data ?? []).map((step: any, idx: number) => (
                  <li key={step.id} className="flex gap-2 items-start">
                    <span className="mt-2 text-xs font-mono text-muted-foreground w-6 text-center">{step.step_number}.</span>
                    <textarea defaultValue={step.instruction_text} onBlur={(e) => updProc.mutate({ id: step.id, testItemId: method.id, patch: { instruction_text: e.target.value } })} rows={2} className="flex-1 px-3 py-2 text-sm bg-background border rounded-md" placeholder="Describe this step..." />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => idx > 0 && reorderStep(procQ.data, step, -1, method.id, qc)} className="p-1 hover:bg-muted rounded"><ChevronUp className="h-3 w-3" /></button>
                      <button onClick={() => idx < (procQ.data!.length - 1) && reorderStep(procQ.data, step, 1, method.id, qc)} className="p-1 hover:bg-muted rounded"><ChevronDown className="h-3 w-3" /></button>
                    </div>
                    <DelBtn onClick={() => delProc.mutate({ id: step.id, testItemId: method.id })} />
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </TabsContent>

        {/* EQUIPMENT */}
        <TabsContent value="equipment" className="space-y-4">
          <Card title="Required Equipment" action={
            <AddBtn onClick={() => insEq.mutate({ test_item_id: method.id, calibration_required: true, is_mandatory: true, display_order: eqQ.data?.length ?? 0 })} />
          }>
            <RelationTable
              loading={eqQ.isLoading}
              empty="No equipment linked yet."
              headers={['Equipment', 'Type', 'Model Req.', 'Attachment', 'Calib?', 'Mandatory?', 'Notes', '']}
              rows={(eqQ.data ?? []).map((row: any) => [
                <select key="e" defaultValue={row.equipment_id ?? ''} onBlur={(e) => updateRow('method_equipment', row.id, method.id, { equipment_id: e.target.value || null })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm">
                  <option value="">— Select —</option>
                  {equipmentList.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                </select>,
                <input key="t" defaultValue={row.equipment_type ?? ''} onBlur={(e) => updateRow('method_equipment', row.id, method.id, { equipment_type: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="m" defaultValue={row.model_required ?? ''} onBlur={(e) => updateRow('method_equipment', row.id, method.id, { model_required: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="a" defaultValue={row.attachment ?? ''} onBlur={(e) => updateRow('method_equipment', row.id, method.id, { attachment: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="c" type="checkbox" defaultChecked={row.calibration_required} onChange={(e) => updateRow('method_equipment', row.id, method.id, { calibration_required: e.target.checked })} />,
                <input key="md" type="checkbox" defaultChecked={row.is_mandatory} onChange={(e) => updateRow('method_equipment', row.id, method.id, { is_mandatory: e.target.checked })} />,
                <input key="n" defaultValue={row.notes ?? ''} onBlur={(e) => updateRow('method_equipment', row.id, method.id, { notes: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <DelBtn key="d" onClick={() => delEq.mutate({ id: row.id, testItemId: method.id })} />,
              ])}
            />
          </Card>
        </TabsContent>

        {/* CALCULATION */}
        <TabsContent value="calculation" className="space-y-4">
          <Card title="Measured Properties & Calculations" action={
            <AddBtn onClick={() => insCalc.mutate({ test_item_id: method.id, property_name: 'New Property', decimals: 2, rounding_rule: 'half-up', display_order: calcQ.data?.length ?? 0 })} />
          }>
            <RelationTable
              loading={calcQ.isLoading}
              empty="No calculations defined yet."
              headers={['Property', 'Formula', 'Unit', 'Decimals', 'Rounding', 'Notes', '']}
              rows={(calcQ.data ?? []).map((row: any) => [
                <input key="p" defaultValue={row.property_name} onBlur={(e) => updateRow('method_calculations', row.id, method.id, { property_name: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="f" defaultValue={row.formula_text ?? ''} onBlur={(e) => updateRow('method_calculations', row.id, method.id, { formula_text: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm font-mono" placeholder="e.g. (Max_Force / Width)" />,
                <input key="u" defaultValue={row.result_unit ?? ''} onBlur={(e) => updateRow('method_calculations', row.id, method.id, { result_unit: e.target.value })} className="w-24 h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="d" type="number" defaultValue={row.decimals} onBlur={(e) => updateRow('method_calculations', row.id, method.id, { decimals: parseInt(e.target.value) || 0 })} className="w-16 h-8 px-2 text-sm bg-background border rounded-sm" />,
                <select key="r" defaultValue={row.rounding_rule} onBlur={(e) => updateRow('method_calculations', row.id, method.id, { rounding_rule: e.target.value })} className="h-8 px-2 text-sm bg-background border rounded-sm">
                  {ROUNDING.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>,
                <input key="n" defaultValue={row.notes ?? ''} onBlur={(e) => updateRow('method_calculations', row.id, method.id, { notes: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <DelBtn key="x" onClick={() => delCalc.mutate({ id: row.id, testItemId: method.id })} />,
              ])}
            />
          </Card>
        </TabsContent>

        {/* ACCEPTANCE */}
        <TabsContent value="acceptance" className="space-y-4">
          <Card title="Acceptance Criteria & QC (ISO 17025 §7.7)" action={
            <AddBtn onClick={() => insAcc.mutate({ test_item_id: method.id, property_name: 'New Property', display_order: accQ.data?.length ?? 0 })} />
          }>
            <RelationTable
              loading={accQ.isLoading}
              empty="No acceptance criteria defined."
              headers={['Property', 'Min', 'Max', 'Unit', 'Spec Ref', 'Uncert.', 'QC Freq.', 'Ref Mat.', '']}
              rows={(accQ.data ?? []).map((row: any) => [
                <input key="p" defaultValue={row.property_name} onBlur={(e) => updateRow('method_acceptance', row.id, method.id, { property_name: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <NumIn key="mn" def={row.min_value} onSave={(v) => updateRow('method_acceptance', row.id, method.id, { min_value: v })} />,
                <NumIn key="mx" def={row.max_value} onSave={(v) => updateRow('method_acceptance', row.id, method.id, { max_value: v })} />,
                <input key="u" defaultValue={row.unit ?? ''} onBlur={(e) => updateRow('method_acceptance', row.id, method.id, { unit: e.target.value })} className="w-20 h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="s" defaultValue={row.specification_ref ?? ''} onBlur={(e) => updateRow('method_acceptance', row.id, method.id, { specification_ref: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <NumIn key="mu" def={row.measurement_uncertainty} onSave={(v) => updateRow('method_acceptance', row.id, method.id, { measurement_uncertainty: v })} />,
                <input key="q" defaultValue={row.qc_frequency ?? ''} onBlur={(e) => updateRow('method_acceptance', row.id, method.id, { qc_frequency: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" placeholder="e.g. monthly" />,
                <input key="r" defaultValue={row.qc_reference_material ?? ''} onBlur={(e) => updateRow('method_acceptance', row.id, method.id, { qc_reference_material: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <DelBtn key="d" onClick={() => delAcc.mutate({ id: row.id, testItemId: method.id })} />,
              ])}
            />
          </Card>
        </TabsContent>

        {/* PARAMETERS */}
        <TabsContent value="parameters" className="space-y-4">
          <Card title="Method-Specific Parameters" action={
            <AddBtn onClick={() => insParam.mutate({ test_item_id: method.id, param_name: 'New Parameter', display_order: paramQ.data?.length ?? 0 })} />
          }>
            <p className="text-xs text-muted-foreground mb-3">Flexible key-value pairs for method-specific settings (e.g. Blue Wool Scale, ICI Box Speed, Crosshead Speed).</p>
            <RelationTable
              loading={paramQ.isLoading}
              empty="No custom parameters defined."
              headers={['Name', 'Value', 'Unit', 'Required?', 'Notes', '']}
              rows={(paramQ.data ?? []).map((row: any) => [
                <input key="n" defaultValue={row.param_name} onBlur={(e) => updateRow('method_parameters', row.id, method.id, { param_name: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="v" defaultValue={row.param_value ?? ''} onBlur={(e) => updateRow('method_parameters', row.id, method.id, { param_value: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="u" defaultValue={row.unit ?? ''} onBlur={(e) => updateRow('method_parameters', row.id, method.id, { unit: e.target.value })} className="w-24 h-8 px-2 text-sm bg-background border rounded-sm" />,
                <input key="m" type="checkbox" defaultChecked={row.is_mandatory} onChange={(e) => updateRow('method_parameters', row.id, method.id, { is_mandatory: e.target.checked })} />,
                <input key="nt" defaultValue={row.notes ?? ''} onBlur={(e) => updateRow('method_parameters', row.id, method.id, { notes: e.target.value })} className="w-full h-8 px-2 text-sm bg-background border rounded-sm" />,
                <DelBtn key="d" onClick={() => delParam.mutate({ id: row.id, testItemId: method.id })} />,
              ])}
            />
          </Card>
        </TabsContent>

        {/* AUDIT & VERSIONS */}
        <TabsContent value="audit" className="space-y-4">
          <Card title="Version History">
            <RelationTable
              loading={versionsQ.isLoading}
              empty="No version snapshots yet. Click 'New Version' to create one."
              headers={['Version', 'Status', 'Prepared By', 'Approved By', 'Effective', 'Notes']}
              rows={(versionsQ.data ?? []).map((v: any) => [
                <span key="v" className="font-mono text-sm">v{v.version_number}</span>,
                <StatusBadge key="s" status={v.status} />,
                <span key="p" className="text-sm">{v.prepared_by ?? '—'}</span>,
                <span key="a" className="text-sm">{v.approved_by ?? '—'}</span>,
                <span key="e" className="text-sm">{v.effective_date ?? '—'}</span>,
                <span key="n" className="text-sm text-muted-foreground">{v.change_notes ?? '—'}</span>,
              ])}
            />
          </Card>

          <Card title="Audit Log (immutable)">
            {auditQ.isLoading ? <SmallSpinner /> : (auditQ.data ?? []).length === 0 ? <Empty msg="No audit entries yet." /> : (
              <ul className="space-y-1.5 text-sm">
                {(auditQ.data ?? []).map((a: any) => (
                  <li key={a.id} className="flex items-start gap-3 py-1.5 border-b last:border-b-0">
                    <span className="text-xs text-muted-foreground font-mono w-32">{new Date(a.created_at).toLocaleString()}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-medium">{a.action}</span>
                    <span className="text-xs text-muted-foreground">{a.changed_by_name ?? '—'}</span>
                    {a.details && <code className="text-xs text-muted-foreground truncate flex-1">{JSON.stringify(a.details).slice(0, 100)}</code>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── small helpers ──────────────────────────────────────────────────────────

async function updateRow(table: string, id: string, testItemId: number, patch: any) {
  const { supabase } = await import('@/integrations/supabase/client');
  const { error } = await (supabase.from(table as any) as any).update(patch).eq('id', id);
  if (error) toast.error(error.message);
}

async function reorderStep(steps: any[] | undefined, step: any, dir: number, testItemId: number, qc: any) {
  if (!steps) return;
  const idx = steps.findIndex((s) => s.id === step.id);
  const swap = steps[idx + dir];
  if (!swap) return;
  const { supabase } = await import('@/integrations/supabase/client');
  await supabase.from('method_procedure_steps').update({ step_number: swap.step_number }).eq('id', step.id);
  await supabase.from('method_procedure_steps').update({ step_number: step.step_number }).eq('id', swap.id);
  qc.invalidateQueries({ queryKey: ['method_procedure_steps', testItemId] });
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function AddBtn({ onClick, label = 'Add' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="h-8 px-2.5 flex items-center gap-1 text-xs font-medium border rounded-md hover:bg-muted">
      <Plus className="h-3 w-3" /> {label}
    </button>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-1 text-destructive hover:bg-destructive/10 rounded">
      <Trash2 className="h-3 w-3" />
    </button>
  );
}

function NumIn({ def, onSave }: { def: number | null; onSave: (v: number | null) => void }) {
  return <input type="number" step="any" defaultValue={def ?? ''} onBlur={(e) => onSave(e.target.value === '' ? null : parseFloat(e.target.value))} className="w-20 h-8 px-2 text-sm bg-background border rounded-sm" />;
}

function SmallSpinner() {
  return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-center text-xs text-muted-foreground py-6">{msg}</div>;
}

function StatusBadge({ status }: { status?: string | null }) {
  const cls = status === 'Active' ? 'bg-success/15 text-success'
    : status === 'Archived' ? 'bg-muted text-muted-foreground'
    : status === 'Superseded' ? 'bg-warning/15 text-warning-foreground'
    : 'bg-warning/15 text-warning-foreground';
  return <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${cls}`}>{status || 'Draft'}</span>;
}

function RelationTable({ loading, empty, headers, rows }: { loading: boolean; empty: string; headers: string[]; rows: React.ReactNode[][] }) {
  if (loading) return <SmallSpinner />;
  if (rows.length === 0) return <Empty msg={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((h, i) => <th key={i} className="text-left px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri} className="border-b last:border-b-0">
              {cells.map((c, ci) => <td key={ci} className="px-2 py-1.5">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
