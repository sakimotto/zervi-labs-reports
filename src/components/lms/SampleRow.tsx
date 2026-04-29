import type { DbSample } from '@/hooks/useSamples';
import { StatusBadge } from './StatusBadge';
import { JudgmentDot } from './JudgmentDot';

interface SampleRowProps {
  sample: DbSample;
  onClick: () => void;
}

export function SampleRow({ sample, onClick }: SampleRowProps) {
  return (
    <tr
      onClick={onClick}
      className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors h-10"
    >
      <td className="px-3 py-2 font-mono text-xs font-medium">
        <div className="flex items-center gap-1.5">
          {sample.sample_id}
          {(sample as any).report_source && (sample as any).report_source !== 'internal' && (
            <span
              className="px-1 py-px rounded-sm text-[9px] font-bold uppercase tracking-wider bg-warning text-warning-foreground"
              title={`External report from ${(sample as any).external_lab_name || (sample as any).report_source}`}
            >
              EXT
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-sm">{sample.product_name}</td>
      <td className="px-3 py-2 text-sm text-muted-foreground">{sample.oem_brand || '—'}</td>
      <td className="px-3 py-2">
        <span className="text-xs px-1.5 py-0.5 rounded-sm bg-muted font-medium">
          {sample.base_type || '—'}
        </span>
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={sample.status || 'Pending'} />
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={sample.priority || 'Normal'} type="priority" />
      </td>
      <td className="px-3 py-2">
        <JudgmentDot judgment={sample.overall_judgment || 'Pending'} />
      </td>
    </tr>
  );
}
