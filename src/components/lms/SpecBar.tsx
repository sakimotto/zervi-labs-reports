interface SpecBarProps {
  value: number | null;
  min?: number;
  max?: number;
}

export function SpecBar({ value, min, max }: SpecBarProps) {
  if (min === undefined && max === undefined) return null;
  if (value === null) return null;

  // Compute a normalized position for the needle
  const lo = min ?? (max! * 0.5);
  const hi = max ?? (min! * 2);
  const range = hi - lo;
  const rangeStart = lo - range * 0.3;
  const rangeEnd = hi + range * 0.3;
  const totalRange = rangeEnd - rangeStart;

  const barLeft = ((lo - rangeStart) / totalRange) * 100;
  const barRight = 100 - ((hi - rangeStart) / totalRange) * 100;
  const needlePos = Math.max(0, Math.min(100, ((value - rangeStart) / totalRange) * 100));

  const inSpec = (min === undefined || value >= min) && (max === undefined || value <= max);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
      <div
        className="absolute h-full bg-primary/20"
        style={{ left: `${barLeft}%`, right: `${barRight}%` }}
      />
      <div
        className={`absolute w-0.5 h-1.5 -top-0.5 transition-all ${inSpec ? 'bg-primary' : 'bg-destructive'}`}
        style={{ left: `${needlePos}%` }}
      />
    </div>
  );
}
