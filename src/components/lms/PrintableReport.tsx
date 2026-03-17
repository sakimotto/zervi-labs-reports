import { DbSample } from '@/hooks/useSamples';
import { DbTestItem, DbTestRequirement, DbTestResult } from '@/hooks/useTestData';
import { useMemo } from 'react';

interface PrintableReportProps {
  sample: DbSample;
  testItems: DbTestItem[];
  requirements: DbTestRequirement[];
  results: DbTestResult[];
  onClose: () => void;
}

export function PrintableReport({ sample, testItems, requirements, results, onClose }: PrintableReportProps) {
  const categories = useMemo(() => {
    const cats = new Map<string, DbTestItem[]>();
    testItems.forEach(item => {
      const list = cats.get(item.category) || [];
      list.push(item);
      cats.set(item.category, list);
    });
    return cats;
  }, [testItems]);

  const getResult = (testItemId: number, direction?: string) =>
    results.find(r => r.test_item_id === testItemId && (r.direction || '') === (direction || ''));

  const getReq = (testItemId: number, direction?: string) =>
    requirements.find(r => r.test_item_id === testItemId && (!direction || r.direction === direction));

  const formatReq = (req?: DbTestRequirement) => {
    if (!req) return '—';
    if (req.requirement_text) return req.requirement_text;
    const parts = [];
    if (req.min_value !== null) parts.push(`≥${req.min_value}`);
    if (req.max_value !== null) parts.push(`≤${req.max_value}`);
    return parts.join(' ') || '—';
  };

  const judgmentLabel = (j: string | null) => {
    if (j === 'OK') return '✓ OK';
    if (j === 'NG') return '✗ NG';
    return '—';
  };

  let rowNum = 0;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto print:static print:overflow-visible">
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-10 bg-card border-b px-4 py-2 flex items-center justify-between shadow-card">
        <span className="text-sm font-semibold">Print Preview</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            🖨 Print / PDF
          </button>
          <button
            onClick={onClose}
            className="h-8 px-4 text-xs font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-6 print:max-w-none bg-white text-black print:text-black" style={{ fontSize: '10px', lineHeight: '1.4' }}>
        {/* Header */}
        <div className="text-center mb-4 border-b-2 border-black pb-3">
          <h1 className="text-base font-bold tracking-wide text-black">ZERVI ASIA CO., LTD.</h1>
          <p className="text-[9px] text-gray-600 mt-0.5">Laboratory Management System — Test Report</p>
        </div>

        {/* Sample Info */}
        <div className="mb-4">
          <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5 text-gray-700">Product Information</div>
          <table className="w-full border border-gray-400" style={{ fontSize: '9px' }}>
            <tbody>
              {[
                ['Sample ID', sample.sample_id, 'Product Name', sample.product_name],
                ['Composition', sample.composition || '—', 'Color', sample.color || '—'],
                ['Base Type', sample.base_type || '—', 'Fabric Type', sample.fabric_type || '—'],
                ['OEM / Brand', sample.oem_brand || '—', 'Application', sample.application || '—'],
                ['Technical Regulation', sample.technical_regulation || '—', 'Standard Requirement', sample.standard_requirement || '—'],
                ['Test Conditions', sample.test_conditions || '—', 'Test Date', sample.test_date || '—'],
                ['Batch Number', sample.batch_number || '—', 'Requested By', sample.requested_by || '—'],
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="px-1.5 py-1 font-semibold bg-gray-100 border-r border-gray-300 w-[18%] text-gray-700">{row[0]}</td>
                  <td className="px-1.5 py-1 border-r border-gray-300 w-[32%]">{row[1]}</td>
                  <td className="px-1.5 py-1 font-semibold bg-gray-100 border-r border-gray-300 w-[18%] text-gray-700">{row[2]}</td>
                  <td className="px-1.5 py-1 w-[32%]">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Test Results */}
        {Array.from(categories.entries()).map(([category, items]) => {
          return (
            <div key={category} className="mb-3">
              <div className="text-[9px] font-bold uppercase tracking-wider mb-1 text-gray-700">{category} Properties</div>
              <table className="w-full border border-gray-400" style={{ fontSize: '9px' }}>
                <thead>
                  <tr className="bg-gray-200 border-b border-gray-400">
                    <th className="px-1 py-1 text-left border-r border-gray-300 w-8">No</th>
                    <th className="px-1 py-1 text-left border-r border-gray-300">Test Item</th>
                    <th className="px-1 py-1 text-center border-r border-gray-300 w-10">Dir.</th>
                    <th className="px-1 py-1 text-center border-r border-gray-300 w-14">Unit</th>
                    <th className="px-1 py-1 text-center border-r border-gray-300 w-16">Req.</th>
                    <th className="px-1 py-1 text-center border-r border-gray-300 w-12">X₁</th>
                    <th className="px-1 py-1 text-center border-r border-gray-300 w-12">X₂</th>
                    <th className="px-1 py-1 text-center border-r border-gray-300 w-12">X₃</th>
                    <th className="px-1 py-1 text-center border-r border-gray-300 w-14">Avg</th>
                    <th className="px-1 py-1 text-center w-10">Judg</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    if (item.direction_required) {
                      const dirs = item.name.includes('Flame') ? ['Warp', 'Weft'] : ['Warp', 'Filling'];
                      rowNum++;
                      return dirs.map((dir, di) => {
                        const res = getResult(item.id, dir);
                        const req = getReq(item.id, dir);
                        return (
                          <tr key={`${item.id}-${dir}`} className="border-b border-gray-300">
                            <td className="px-1 py-0.5 border-r border-gray-300 text-center">{di === 0 ? rowNum : ''}</td>
                            <td className="px-1 py-0.5 border-r border-gray-300 font-medium">{di === 0 ? item.name : ''}</td>
                            <td className="px-1 py-0.5 border-r border-gray-300 text-center text-gray-600">{dir}</td>
                            <td className="px-1 py-0.5 border-r border-gray-300 text-center">{di === 0 ? (item.unit || '') : ''}</td>
                            <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono">{formatReq(req)}</td>
                            <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono">{res?.result_text ?? (res?.sample_1 ?? '')}</td>
                            <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono">{res?.result_text ? '' : res?.sample_2 ?? ''}</td>
                            <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono">{res?.result_text ? '' : res?.sample_3 ?? ''}</td>
                            <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono font-semibold">{res?.result_text || res?.average_value ?? ''}</td>
                            <td className={`px-1 py-0.5 text-center font-semibold ${res?.judgment === 'NG' ? 'text-red-600' : ''}`}>{judgmentLabel(res?.judgment || null)}</td>
                          </tr>
                        );
                      });
                    }
                    rowNum++;
                    const res = getResult(item.id);
                    const req = getReq(item.id);
                    return (
                      <tr key={item.id} className="border-b border-gray-300">
                        <td className="px-1 py-0.5 border-r border-gray-300 text-center">{rowNum}</td>
                        <td className="px-1 py-0.5 border-r border-gray-300 font-medium">{item.name}</td>
                        <td className="px-1 py-0.5 border-r border-gray-300 text-center">—</td>
                        <td className="px-1 py-0.5 border-r border-gray-300 text-center">{item.unit || ''}</td>
                        <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono">{formatReq(req)}</td>
                        <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono">{res?.result_text || res?.sample_1 ?? ''}</td>
                        <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono">{res?.result_text ? '' : res?.sample_2 ?? ''}</td>
                        <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono">{res?.result_text ? '' : res?.sample_3 ?? ''}</td>
                        <td className="px-1 py-0.5 border-r border-gray-300 text-center font-mono font-semibold">{res?.result_text || res?.average_value ?? ''}</td>
                        <td className={`px-1 py-0.5 text-center font-semibold ${res?.judgment === 'NG' ? 'text-red-600' : ''}`}>{judgmentLabel(res?.judgment || null)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Overall Judgment */}
        <div className="mt-4 p-3 border-2 border-gray-400 text-center">
          <span className="text-[11px] font-bold">OVERALL JUDGMENT: </span>
          <span className={`text-[11px] font-bold ${sample.overall_judgment === 'NG' ? 'text-red-600' : 'text-green-700'}`}>
            {sample.overall_judgment === 'OK' ? '✓ ALL TESTS PASSED (OK)' : sample.overall_judgment === 'NG' ? '✗ FAILED (NG)' : 'PENDING'}
          </span>
        </div>

        {/* Approval */}
        <div className="mt-6 grid grid-cols-3 gap-4" style={{ fontSize: '9px' }}>
          {['Prepared By', 'Checked By', 'Approved By'].map(role => (
            <div key={role} className="text-center">
              <div className="h-10 border-b border-gray-400 mb-1"></div>
              <div className="font-semibold text-gray-600">{role}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400" style={{ fontSize: '8px' }}>
          <p>Zervi Asia Co., Ltd. — Generated {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
