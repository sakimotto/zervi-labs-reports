import { useState, useMemo } from 'react';
import { mockSamples, mockTestItems, mockRequirements, mockResults, autoJudge } from '@/data/mockData';
import { JudgmentDot } from './JudgmentDot';
import { StatusBadge } from './StatusBadge';
import { SpecBar } from './SpecBar';
import { ArrowLeft, FlaskConical, Save } from 'lucide-react';
import type { Judgment, TestResult } from '@/types/lms';

interface SampleDetailProps {
  sampleId: string;
  onBack: () => void;
}

export function SampleDetail({ sampleId, onBack }: SampleDetailProps) {
  const sample = mockSamples.find(s => s.id === sampleId);
  const [results, setResults] = useState<TestResult[]>(mockResults);

  const categories = useMemo(() => {
    const cats = new Map<string, typeof mockTestItems>();
    mockTestItems.forEach(item => {
      const list = cats.get(item.category) || [];
      list.push(item);
      cats.set(item.category, list);
    });
    return cats;
  }, []);

  if (!sample) return null;

  const getResult = (testItemId: number, direction?: string) =>
    results.find(r => r.testItemId === testItemId && r.direction === direction);

  const getReq = (testItemId: number, direction?: string) =>
    mockRequirements.find(r => r.testItemId === testItemId && (!direction || r.direction === direction));

  const updateSampleValue = (resultId: number, sampleIndex: number, value: string) => {
    setResults(prev => prev.map(r => {
      if (r.id !== resultId) return r;
      const newSamples = [...r.samples];
      newSamples[sampleIndex] = value === '' ? null : parseFloat(value);
      const validSamples = newSamples.filter((v): v is number => v !== null);
      const avg = validSamples.length > 0
        ? Math.round((validSamples.reduce((a, b) => a + b, 0) / validSamples.length) * 100) / 100
        : null;
      const req = getReq(r.testItemId, r.direction);
      const judgment = autoJudge(avg, req);
      return { ...r, samples: newSamples, average: avg, judgment };
    }));
  };

  const infoFields = [
    { label: 'Sample ID', value: sample.sampleId, mono: true },
    { label: 'Product', value: sample.productName },
    { label: 'Composition', value: sample.composition },
    { label: 'Color', value: sample.color },
    { label: 'Base Type', value: sample.baseType },
    { label: 'OEM / Brand', value: sample.oemBrand },
    { label: 'Application', value: sample.application },
    { label: 'Test Conditions', value: sample.testConditions },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b bg-card shadow-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-muted rounded transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <FlaskConical className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold tracking-tight">ZERVI ASIA LABORATORY</span>
          <span className="text-xs text-muted-foreground">/ {sample.sampleId}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={sample.status} />
          <button className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Save className="h-3.5 w-3.5" />
            Save
            <kbd className="ml-1 px-1 py-0.5 bg-primary-foreground/20 rounded text-[10px] font-mono">⌘↵</kbd>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Sample Info Header */}
        <div className="bg-card rounded-lg shadow-card p-4 mb-4">
          <div className="grid grid-cols-4 gap-x-6 gap-y-2">
            {infoFields.map(f => (
              <div key={f.label}>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</div>
                <div className={`text-sm font-medium ${f.mono ? 'font-mono' : ''}`}>{f.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results Grid */}
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
                    if (item.directionRequired) {
                      const directions = ['Warp', 'Filling'];
                      if (item.id === 12) directions.splice(0, 2, 'Warp', 'Weft');
                      return directions.map((dir, di) => (
                        <TestResultRow
                          key={`${item.id}-${dir}`}
                          itemName={di === 0 ? item.name : ''}
                          direction={dir}
                          unit={di === 0 ? item.unit : ''}
                          result={getResult(item.id, dir)}
                          requirement={getReq(item.id, dir)}
                          onUpdateSample={updateSampleValue}
                          isSubRow={di > 0}
                        />
                      ));
                    }
                    return (
                      <TestResultRow
                        key={item.id}
                        itemName={item.name}
                        unit={item.unit}
                        result={getResult(item.id)}
                        requirement={getReq(item.id)}
                        onUpdateSample={updateSampleValue}
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

interface TestResultRowProps {
  itemName: string;
  direction?: string;
  unit: string;
  result?: TestResult;
  requirement?: { minValue?: number; maxValue?: number; requirementText?: string };
  onUpdateSample: (resultId: number, sampleIndex: number, value: string) => void;
  isSubRow?: boolean;
}

function TestResultRow({ itemName, direction, unit, result, requirement, onUpdateSample, isSubRow }: TestResultRowProps) {
  const reqDisplay = requirement
    ? requirement.requirementText || [
        requirement.minValue !== undefined ? `≥${requirement.minValue}` : '',
        requirement.maxValue !== undefined ? `≤${requirement.maxValue}` : '',
      ].filter(Boolean).join(' ')
    : '—';

  const isNG = result?.judgment === 'NG';

  return (
    <tr className={`border-b last:border-b-0 h-10 group ${isNG ? 'bg-destructive/5' : ''}`}>
      <td className="px-3 py-1 text-sm font-medium" style={{ textWrap: 'balance' as any }}>
        {itemName}
      </td>
      <td className="px-3 py-1 text-xs text-muted-foreground">{direction || ''}</td>
      <td className="px-3 py-1 text-xs text-muted-foreground">{unit}</td>
      <td className="px-3 py-1 text-xs text-center font-mono text-muted-foreground">{reqDisplay}</td>
      {[0, 1, 2].map(i => (
        <td key={i} className="px-1 py-1">
          {result ? (
            <div className="relative">
              <input
                type="number"
                step="any"
                value={result.samples[i] ?? ''}
                onChange={e => onUpdateSample(result.id, i, e.target.value)}
                className="w-full h-8 px-2 text-sm tabular-nums text-center bg-transparent rounded-sm border-0 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              />
              {requirement && (
                <SpecBar value={result.samples[i]} min={requirement.minValue} max={requirement.maxValue} />
              )}
            </div>
          ) : (
            <input
              type="number"
              step="any"
              className="w-full h-8 px-2 text-sm tabular-nums text-center bg-transparent rounded-sm border-0 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              placeholder="—"
            />
          )}
        </td>
      ))}
      <td className="px-3 py-1 text-center">
        <span className="tabular-nums text-sm font-medium">
          {result?.average ?? '—'}
        </span>
      </td>
      <td className="px-3 py-1">
        <div className="flex justify-center">
          <JudgmentDot judgment={result?.judgment || 'Pending'} showLabel={false} />
        </div>
      </td>
    </tr>
  );
}
