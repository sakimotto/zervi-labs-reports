import type { Sample } from '@/types/lms';
import { StatusBadge } from './StatusBadge';
import { JudgmentDot } from './JudgmentDot';

interface SampleRowProps {
  sample: Sample;
  onClick: () => void;
}

export function SampleRow({ sample, onClick }: SampleRowProps) {
  const progress = sample.testsTotal > 0 
    ? Math.round((sample.testsCompleted / sample.testsTotal) * 100) 
    : 0;

  return (
    <tr
      onClick={onClick}
      className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors h-10"
    >
      <td className="px-3 py-2 font-mono text-xs font-medium">{sample.sampleId}</td>
      <td className="px-3 py-2 text-sm">{sample.productName}</td>
      <td className="px-3 py-2 text-sm text-muted-foreground">{sample.oemBrand}</td>
      <td className="px-3 py-2">
        <span className="text-xs px-1.5 py-0.5 rounded-sm bg-muted font-medium">
          {sample.baseType}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {sample.testsCompleted}/{sample.testsTotal}
          </span>
        </div>
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={sample.status} />
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={sample.priority} type="priority" />
      </td>
      <td className="px-3 py-2">
        <JudgmentDot judgment={sample.overallJudgment} />
      </td>
    </tr>
  );
}
