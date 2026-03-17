import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSample, useUpdateSample } from '@/hooks/useSamples';
import { useTestItems, useTestRequirements, useTestResults, useUpsertTestResult, autoJudge } from '@/hooks/useTestData';
import { useSampleTestItems, useTestProgram } from '@/hooks/useTestPrograms';
import type { DbTestResult, DbTestRequirement } from '@/hooks/useTestData';
import { JudgmentDot } from './JudgmentDot';
import { StatusBadge } from './StatusBadge';
import { SpecBar } from './SpecBar';
import { PrintableReport } from './PrintableReport';
import { DeleteSampleDialog } from './DeleteSampleDialog';
import { ArrowLeft, FlaskConical, Save, Loader2, Printer, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface SampleDetailProps {
  sampleId: string;
  onBack: () => void;
}

export function SampleDetail({ sampleId, onBack }: SampleDetailProps) {
  const { data: sample, isLoading: sampleLoading } = useSample(sampleId);
  const { data: allTestItems = [] } = useTestItems();
  const { data: requirements = [] } = useTestRequirements(sample?.oem_brand || undefined);
  const { data: dbResults = [] } = useTestResults(sampleId);
  const { data: assignedItemIds } = useSampleTestItems(sampleId, sample?.test_program_id);
  const upsertResult = useUpsertTestResult();
  const updateSample = useUpdateSample();

  // Local editable state seeded from DB
  const [localResults, setLocalResults] = useState<Map<string, LocalResult>>(new Map());
  const [dirty, setDirty] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (dbResults.length > 0) {
      const map = new Map<string, LocalResult>();
      dbResults.forEach(r => {
        const key = `${r.test_item_id}-${r.direction || ''}`;
        map.set(key, {
          id: r.id,
          test_item_id: r.test_item_id!,
          direction: r.direction || undefined,
          samples: [r.sample_1, r.sample_2, r.sample_3],
          average: r.average_value,
          judgment: (r.judgment as 'OK' | 'NG' | 'Pending') || 'Pending',
        });
      });
      setLocalResults(map);
    }
  }, [dbResults]);

  // Filter test items by program assignment (null = show all)
  const testItems = useMemo(() => {
    if (!assignedItemIds) return allTestItems;
    const idSet = new Set(assignedItemIds);
    return allTestItems.filter(item => idSet.has(item.id));
  }, [allTestItems, assignedItemIds]);

  const categories = useMemo(() => {
    const cats = new Map<string, typeof testItems>();
    testItems.forEach(item => {
      const list = cats.get(item.category) || [];
      list.push(item);
      cats.set(item.category, list);
    });
    return cats;
  }, [testItems]);

  const getReq = useCallback((testItemId: number, direction?: string): DbTestRequirement | undefined => {
    return requirements.find(r =>
      r.test_item_id === testItemId && (!direction || r.direction === direction)
    );
  }, [requirements]);

  const getLocal = (testItemId: number, direction?: string) => {
    return localResults.get(`${testItemId}-${direction || ''}`);
  };

  const updateSampleValue = (testItemId: number, direction: string | undefined, sampleIndex: number, value: string) => {
    const key = `${testItemId}-${direction || ''}`;
    setLocalResults(prev => {
      const next = new Map(prev);
      const existing = next.get(key) || {
        test_item_id: testItemId,
        direction,
        samples: [null, null, null],
        average: null,
        judgment: 'Pending' as const,
      };
      const newSamples = [...existing.samples];
      newSamples[sampleIndex] = value === '' ? null : parseFloat(value);
      const valid = newSamples.filter((v): v is number => v !== null);
      const avg = valid.length > 0
        ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100
        : null;
      const req = getReq(testItemId, direction);
      const judgment = autoJudge(avg, req);
      next.set(key, { ...existing, samples: newSamples, average: avg, judgment });
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!sample) return;
    try {
      const promises = Array.from(localResults.values()).map(r =>
        upsertResult.mutateAsync({
          sample_id: sampleId,
          test_item_id: r.test_item_id,
          direction: r.direction || null,
          sample_1: r.samples[0],
          sample_2: r.samples[1],
          sample_3: r.samples[2],
          average_value: r.average,
          judgment: r.judgment,
        })
      );
      await Promise.all(promises);
      setDirty(false);
      toast.success('Results saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  if (sampleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sample) return null;

  const infoFields = [
    { label: 'Sample ID', key: 'sample_id', value: sample.sample_id, mono: true, readonly: true },
    { label: 'Product', key: 'product_name', value: sample.product_name },
    { label: 'Composition', key: 'composition', value: sample.composition },
    { label: 'Color', key: 'color', value: sample.color },
    { label: 'Base Type', key: 'base_type', value: sample.base_type },
    { label: 'OEM / Brand', key: 'oem_brand', value: sample.oem_brand },
    { label: 'Application', key: 'application', value: sample.application },
    { label: 'Test Conditions', key: 'test_conditions', value: sample.test_conditions },
    { label: 'Tech. Regulation', key: 'technical_regulation', value: sample.technical_regulation },
    { label: 'Standard Req.', key: 'standard_requirement', value: sample.standard_requirement },
    { label: 'Batch Number', key: 'batch_number', value: sample.batch_number },
    { label: 'Requested By', key: 'requested_by', value: sample.requested_by },
  ];

  const startEditInfo = () => {
    const form: Record<string, string> = {};
    infoFields.forEach(f => { form[f.key] = (f.value as string) || ''; });
    setEditForm(form);
    setEditingInfo(true);
  };

  const saveInfoEdit = async () => {
    try {
      await updateSample.mutateAsync({ id: sampleId, ...editForm } as any);
      setEditingInfo(false);
      toast.success('Sample info updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {showPrint && (
        <PrintableReport
          sample={sample}
          testItems={testItems}
          requirements={requirements}
          results={dbResults}
          onClose={() => setShowPrint(false)}
        />
      )}
      {showDelete && (
        <DeleteSampleDialog
          sampleId={sampleId}
          sampleLabel={sample.sample_id}
          onClose={() => setShowDelete(false)}
          onDeleted={onBack}
        />
      )}

      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-muted rounded transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">{sample.sample_id}</span>
          <StatusBadge status={sample.status || 'Pending'} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPrint(true)} className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={() => setShowDelete(true)} className="h-8 px-2 flex items-center text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleSave} disabled={!dirty || upsertResult.isPending}
            className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Save className="h-3.5 w-3.5" />
            {upsertResult.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-card rounded-lg shadow-card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sample Information</div>
            {editingInfo ? (
              <div className="flex gap-1">
                <button onClick={saveInfoEdit} disabled={updateSample.isPending} className="h-6 px-2 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {updateSample.isPending ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingInfo(false)} className="h-6 px-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button onClick={startEditInfo} className="h-6 px-2 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:bg-muted rounded transition-colors">
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-x-6 gap-y-2">
            {infoFields.map(f => (
              <div key={f.label}>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</div>
                {editingInfo && !f.readonly ? (
                  <input
                    value={editForm[f.key] || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full h-7 px-2 text-sm bg-background border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  <div className={`text-sm font-medium ${f.mono ? 'font-mono' : ''}`}>{f.value || '—'}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {Array.from(categories.entries()).map(([category, items]) => (
          <div key={category} className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {category} Properties
            </div>
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-48">Test Item</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">Dir.</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">Unit</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-14">Req.</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">X1</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">X2</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">X3</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">Avg</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">J</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    if (item.direction_required) {
                      const directions = item.name.includes('Flame') ? ['Warp', 'Weft'] : ['Warp', 'Filling'];
                      return directions.map((dir, di) => (
                        <TestResultRow
                          key={`${item.id}-${dir}`}
                          itemName={di === 0 ? item.name : ''}
                          direction={dir}
                          unit={di === 0 ? (item.unit || '') : ''}
                          localResult={getLocal(item.id, dir)}
                          requirement={getReq(item.id, dir)}
                          onUpdateSample={(si, val) => updateSampleValue(item.id, dir, si, val)}
                          isSubRow={di > 0}
                        />
                      ));
                    }
                    return (
                      <TestResultRow
                        key={item.id}
                        itemName={item.name}
                        unit={item.unit || ''}
                        localResult={getLocal(item.id)}
                        requirement={getReq(item.id)}
                        onUpdateSample={(si, val) => updateSampleValue(item.id, undefined, si, val)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LocalResult {
  id?: number;
  test_item_id: number;
  direction?: string;
  samples: (number | null)[];
  average: number | null;
  judgment: 'OK' | 'NG' | 'Pending';
}

interface TestResultRowProps {
  itemName: string;
  direction?: string;
  unit: string;
  localResult?: LocalResult;
  requirement?: DbTestRequirement;
  onUpdateSample: (sampleIndex: number, value: string) => void;
  isSubRow?: boolean;
}

function TestResultRow({ itemName, direction, unit, localResult, requirement, onUpdateSample, isSubRow }: TestResultRowProps) {
  const reqDisplay = requirement
    ? requirement.requirement_text || [
        requirement.min_value !== null ? `≥${requirement.min_value}` : '',
        requirement.max_value !== null ? `≤${requirement.max_value}` : '',
      ].filter(Boolean).join(' ')
    : '—';

  const isNG = localResult?.judgment === 'NG';

  return (
    <tr className={`border-b last:border-b-0 h-10 group ${isNG ? 'bg-destructive/5' : ''}`}>
      <td className="px-3 py-1 text-sm font-medium">{itemName}</td>
      <td className="px-3 py-1 text-xs text-muted-foreground">{direction || ''}</td>
      <td className="px-3 py-1 text-xs text-muted-foreground">{unit}</td>
      <td className="px-3 py-1 text-xs text-center font-mono text-muted-foreground">{reqDisplay}</td>
      {[0, 1, 2].map(i => (
        <td key={i} className="px-1 py-1">
          <div className="relative">
            <input
              type="number"
              step="any"
              value={localResult?.samples[i] ?? ''}
              onChange={e => onUpdateSample(i, e.target.value)}
              className="w-full h-8 px-2 text-sm tabular-nums text-center bg-transparent rounded-sm border-0 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            />
            {requirement && localResult?.samples[i] != null && (
              <SpecBar value={localResult.samples[i]} min={requirement.min_value} max={requirement.max_value} />
            )}
          </div>
        </td>
      ))}
      <td className="px-3 py-1 text-center">
        <span className="tabular-nums text-sm font-medium">
          {localResult?.average ?? '—'}
        </span>
      </td>
      <td className="px-3 py-1">
        <div className="flex justify-center">
          <JudgmentDot judgment={localResult?.judgment || 'Pending'} showLabel={false} />
        </div>
      </td>
    </tr>
  );
}
