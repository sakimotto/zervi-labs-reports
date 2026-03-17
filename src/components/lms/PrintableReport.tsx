import { DbSample } from '@/hooks/useSamples';
import { DbTestItem, DbTestRequirement, DbTestResult } from '@/hooks/useTestData';
import { useMemo } from 'react';

interface TestProgramMeta {
  report_title?: string | null;
  report_header_notes?: string | null;
  report_footer_notes?: string | null;
  show_signatures?: boolean | null;
  signature_roles?: string[] | null;
  report_columns?: string[] | null;
}

interface PrintableReportProps {
  sample: DbSample;
  testItems: DbTestItem[];
  requirements: DbTestRequirement[];
  results: DbTestResult[];
  testProgram?: TestProgramMeta;
  onClose: () => void;
}

const COLUMN_LABELS: Record<string, string> = {
  test_name: 'Test Item',
  direction: 'Dir.',
  unit: 'Unit',
  requirement: 'Req.',
  x1: 'X₁',
  x2: 'X₂',
  x3: 'X₃',
  average: 'Avg',
  judgment: 'Judg',
};

const DEFAULT_COLUMNS = ['test_name', 'direction', 'unit', 'requirement', 'x1', 'x2', 'x3', 'average', 'judgment'];

export function PrintableReport({ sample, testItems, requirements, results, testProgram, onClose }: PrintableReportProps) {
  const columns = useMemo(() => {
    const cols = (testProgram?.report_columns as string[] | null) || DEFAULT_COLUMNS;
    return cols.filter(c => COLUMN_LABELS[c]);
  }, [testProgram]);

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

  const reportTitle = testProgram?.report_title || 'Laboratory Management System — Test Report';
  const headerNotes = testProgram?.report_header_notes;
  const footerNotes = testProgram?.report_footer_notes;
  const showSignatures = testProgram?.show_signatures !== false;
  const signatureRoles = (testProgram?.signature_roles as string[] | null) || ['Prepared By', 'Checked By', 'Approved By'];

  const renderCellValue = (col: string, item: DbTestItem, res: ReturnType<typeof getResult>, req: ReturnType<typeof getReq>, dir?: string, isSubRow?: boolean) => {
    switch (col) {
      case 'test_name': return isSubRow ? '' : item.name;
      case 'direction': return dir || '—';
      case 'unit': return isSubRow ? '' : (item.unit || '');
      case 'requirement': return formatReq(req);
      case 'x1': return res?.result_text ?? (res?.sample_1 ?? '');
      case 'x2': return res?.result_text ? '' : res?.sample_2 ?? '';
      case 'x3': return res?.result_text ? '' : res?.sample_3 ?? '';
      case 'average': return res?.result_text ?? (res?.average_value ?? '');
      case 'judgment': return judgmentLabel(res?.judgment || null);
      default: return '';
    }
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
          <p className="text-[9px] text-gray-600 mt-0.5">{reportTitle}</p>
        </div>

        {/* Header Notes */}
        {headerNotes && (
          <div className="mb-3 p-2 border border-gray-300 bg-gray-50 text-[9px] text-gray-700 whitespace-pre-line">
            {headerNotes}
          </div>
        )}

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
        {Array.from(categories.entries()).map(([category, items]) => (
          <div key={category} className="mb-3">
            <div className="text-[9px] font-bold uppercase tracking-wider mb-1 text-gray-700">{category} Properties</div>
            <table className="w-full border border-gray-400" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-gray-200 border-b border-gray-400">
                  <th className="px-1 py-1 text-left border-r border-gray-300 w-8">No</th>
                  {columns.map(col => (
                    <th key={col} className={`px-1 py-1 border-r border-gray-300 last:border-r-0 ${col === 'test_name' ? 'text-left' : 'text-center'} ${col === 'test_name' ? '' : 'w-14'}`}>
                      {COLUMN_LABELS[col]}
                    </th>
                  ))}
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
                          {columns.map(col => (
                            <td
                              key={col}
                              className={`px-1 py-0.5 border-r border-gray-300 last:border-r-0 font-mono ${col === 'test_name' ? 'font-medium font-sans' : 'text-center'} ${col === 'judgment' && res?.judgment === 'NG' ? 'text-red-600 font-semibold' : ''} ${col === 'average' ? 'font-semibold' : ''}`}
                            >
                              {renderCellValue(col, item, res, req, dir, di > 0)}
                            </td>
                          ))}
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
                      {columns.map(col => (
                        <td
                          key={col}
                          className={`px-1 py-0.5 border-r border-gray-300 last:border-r-0 font-mono ${col === 'test_name' ? 'font-medium font-sans' : 'text-center'} ${col === 'judgment' && res?.judgment === 'NG' ? 'text-red-600 font-semibold' : ''} ${col === 'average' ? 'font-semibold' : ''}`}
                        >
                          {renderCellValue(col, item, res, req, '—', false)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* Overall Judgment */}
        <div className="mt-4 p-3 border-2 border-gray-400 text-center">
          <span className="text-[11px] font-bold">OVERALL JUDGMENT: </span>
          <span className={`text-[11px] font-bold ${sample.overall_judgment === 'NG' ? 'text-red-600' : 'text-green-700'}`}>
            {sample.overall_judgment === 'OK' ? '✓ ALL TESTS PASSED (OK)' : sample.overall_judgment === 'NG' ? '✗ FAILED (NG)' : 'PENDING'}
          </span>
        </div>

        {/* Footer Notes */}
        {footerNotes && (
          <div className="mt-3 p-2 border border-gray-300 bg-gray-50 text-[9px] text-gray-700 whitespace-pre-line">
            {footerNotes}
          </div>
        )}

        {/* Signatures */}
        {showSignatures && (
          <div className="mt-6 grid gap-4" style={{ fontSize: '9px', gridTemplateColumns: `repeat(${signatureRoles.length}, 1fr)` }}>
            {signatureRoles.map(role => (
              <div key={role} className="text-center">
                <div className="h-10 border-b border-gray-400 mb-1"></div>
                <div className="font-semibold text-gray-600">{role}</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400" style={{ fontSize: '8px' }}>
          <p>Zervi Asia Co., Ltd. — Generated {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
